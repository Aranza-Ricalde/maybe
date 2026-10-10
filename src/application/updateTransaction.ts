import type { LedgerOperations, LedgerUnitOfWork, TransactionEditInput, TransactionRecord } from "@/domain/ledger/ports";
import { InvalidTransactionError, assertValidAmountCents, assertValidIsoDate, assertValidTransactionName, classifyFlow } from "@/domain/ledger/rules";
import { applyTransactionDelta, reverseTransaction } from "./applyTransactionDelta";
import { requireActiveAccount } from "./requireActiveAccount";

export interface UpdateTransactionInput extends TransactionEditInput {
  id: number;
}

function assertValidInput(input: UpdateTransactionInput): void {
  assertValidAmountCents(input.amountCents);
  assertValidIsoDate(input.date);
  assertValidTransactionName(input.name);
}

async function applyUpdate(ops: LedgerOperations, input: UpdateTransactionInput): Promise<TransactionRecord> {
  const existing = await ops.getTransaction(input.id);
  if (!existing) {
    throw new InvalidTransactionError(`la transacción ${input.id} no existe`);
  }

  const newAccount = await requireActiveAccount(ops, input.accountId);

  await reverseTransaction(ops, existing);

  await applyTransactionDelta(ops, {
    familyId: newAccount.familyId,
    accountId: input.accountId,
    date: input.date,
    amountCents: input.amountCents,
    categoryId: input.categoryId,
    kind: existing.kind,
    flow: classifyFlow(input.amountCents),
  });

  return ops.updateTransactionRow(input.id, {
    accountId: input.accountId,
    date: input.date,
    amountCents: input.amountCents,
    name: input.name,
    categoryId: input.categoryId,
    conceptId: input.conceptId,
  });
}

export class UpdateTransactionUseCase {
  constructor(private readonly uow: LedgerUnitOfWork) {}

  async execute(input: UpdateTransactionInput): Promise<TransactionRecord> {
    assertValidInput(input);
    return this.uow.run((ops) => applyUpdate(ops, input));
  }

  async executeMany(inputs: UpdateTransactionInput[]): Promise<TransactionRecord[]> {
    inputs.forEach(assertValidInput);
    return this.uow.run(async (ops) => {
      const updated: TransactionRecord[] = [];
      for (const input of inputs) updated.push(await applyUpdate(ops, input));
      return updated;
    });
  }
}
