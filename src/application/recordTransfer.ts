import type { LedgerOperations, LedgerUnitOfWork, TransactionRecord } from "@/domain/ledger/ports";
import { assertValidAmountCents, assertValidIsoDate, classifyFlow, InvalidTransactionError, type TransactionKind } from "@/domain/ledger/rules";
import { applyTransactionDelta } from "./applyTransactionDelta";
import { requireActiveAccount } from "./requireActiveAccount";

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
      const fromAccount = await requireActiveAccount(ops, input.fromAccountId);
      const toAccount = await requireActiveAccount(ops, input.toAccountId);

      const outflow = await this.postLeg(ops, input, { accountId: input.fromAccountId, familyId: fromAccount.familyId, amountCents: -magnitude, name: OUTFLOW_NAMES[input.kind] });
      const inflow = await this.postLeg(ops, input, { accountId: input.toAccountId, familyId: toAccount.familyId, amountCents: magnitude, name: INFLOW_NAMES[input.kind] });

      await ops.linkTransfer(outflow.id, inflow.id);

      return { outflow, inflow };
    });
  }

  private async postLeg(ops: LedgerOperations, input: RecordTransferInput, leg: TransferLeg): Promise<TransactionRecord> {
    const transaction = await ops.insertTransaction({
      accountId: leg.accountId,
      date: input.date,
      amountCents: leg.amountCents,
      name: leg.name,
      notes: input.notes ?? null,
      kind: input.kind,
      status: "posted",
      source: "manual",
    });
    await applyTransactionDelta(ops, {
      familyId: leg.familyId,
      accountId: leg.accountId,
      date: input.date,
      amountCents: leg.amountCents,
      categoryId: null,
      kind: input.kind,
      flow: classifyFlow(leg.amountCents),
    });
    return transaction;
  }
}

interface TransferLeg {
  accountId: number;
  familyId: number;
  amountCents: number;
  name: string;
}
