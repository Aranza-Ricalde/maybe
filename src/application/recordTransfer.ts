import type { LedgerUnitOfWork, TransactionRecord } from "@/domain/ledger/ports";
import { assertValidAmountCents, assertValidIsoDate, classifyFlow, InvalidTransactionError, type TransactionKind } from "@/domain/ledger/rules";
import { applyTransactionDelta } from "./applyTransactionDelta";

const TRANSFER_MOVEMENT_KINDS: readonly TransactionKind[] = ["transfer", "loan_payment", "cc_payment"];

export interface RecordTransferInput {
  kind: "transfer" | "loan_payment" | "cc_payment";
  fromAccountId: number;
  toAccountId: number;
  date: string;
  amountCents: number;
  notes?: string | null;
}

export interface RecordTransferResult {
  outflow: TransactionRecord;
  inflow: TransactionRecord;
}

const OUTFLOW_NAMES: Record<RecordTransferInput["kind"], string> = {
  transfer: "Transferencia enviada",
  loan_payment: "Pago de préstamo",
  cc_payment: "Pago de tarjeta",
};

const INFLOW_NAMES: Record<RecordTransferInput["kind"], string> = {
  transfer: "Transferencia recibida",
  loan_payment: "Pago de préstamo recibido",
  cc_payment: "Pago de tarjeta recibido",
};

export class RecordTransferUseCase {
  constructor(private readonly uow: LedgerUnitOfWork) {}

  async execute(input: RecordTransferInput): Promise<RecordTransferResult> {
    const magnitude = Math.abs(input.amountCents);
    assertValidAmountCents(magnitude);
    assertValidIsoDate(input.date);
    if (!TRANSFER_MOVEMENT_KINDS.includes(input.kind)) {
      throw new InvalidTransactionError(`kind inválido para una transferencia: "${input.kind}"`);
    }
    if (input.fromAccountId === input.toAccountId) {
      throw new InvalidTransactionError("la cuenta origen y destino no pueden ser la misma");
    }

    return this.uow.run(async (ops) => {
      const fromAccount = await ops.getAccount(input.fromAccountId);
      if (!fromAccount) throw new InvalidTransactionError(`la cuenta ${input.fromAccountId} no existe`);
      if (!fromAccount.isActive) throw new InvalidTransactionError(`la cuenta ${input.fromAccountId} está inactiva`);

      const toAccount = await ops.getAccount(input.toAccountId);
      if (!toAccount) throw new InvalidTransactionError(`la cuenta ${input.toAccountId} no existe`);
      if (!toAccount.isActive) throw new InvalidTransactionError(`la cuenta ${input.toAccountId} está inactiva`);

      const outflow = await ops.insertTransaction({
        accountId: input.fromAccountId,
        date: input.date,
        amountCents: -magnitude,
        name: OUTFLOW_NAMES[input.kind],
        notes: input.notes ?? null,
        kind: input.kind,
        status: "posted",
        source: "manual",
      });
      await applyTransactionDelta(ops, {
        familyId: fromAccount.familyId,
        accountId: input.fromAccountId,
        date: input.date,
        amountCents: -magnitude,
        categoryId: null,
        kind: input.kind,
        flow: classifyFlow(-magnitude),
      });

      const inflow = await ops.insertTransaction({
        accountId: input.toAccountId,
        date: input.date,
        amountCents: magnitude,
        name: INFLOW_NAMES[input.kind],
        notes: input.notes ?? null,
        kind: input.kind,
        status: "posted",
        source: "manual",
      });
      await applyTransactionDelta(ops, {
        familyId: toAccount.familyId,
        accountId: input.toAccountId,
        date: input.date,
        amountCents: magnitude,
        categoryId: null,
        kind: input.kind,
        flow: classifyFlow(magnitude),
      });

      await ops.linkTransfer(outflow.id, inflow.id);

      return { outflow, inflow };
    });
  }
}
