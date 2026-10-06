import type { LedgerUnitOfWork, TransactionEditInput, TransactionRecord } from "@/domain/ledger/ports";
import { InvalidTransactionError, assertValidAmountCents, assertValidIsoDate, assertValidTransactionName, classifyFlow } from "@/domain/ledger/rules";
import { applyTransactionDelta, reverseTransaction } from "./applyTransactionDelta";
import { requireActiveAccount } from "./requireActiveAccount";

export interface UpdateTransactionInput extends TransactionEditInput {
  id: number;
}

export class UpdateTransactionUseCase {
  constructor(private readonly uow: LedgerUnitOfWork) {}

  async execute(input: UpdateTransactionInput): Promise<TransactionRecord> {
    assertValidAmountCents(input.amountCents);
    assertValidIsoDate(input.date);
    assertValidTransactionName(input.name);

    return this.uow.run(async (ops) => {
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
    });
  }
}
