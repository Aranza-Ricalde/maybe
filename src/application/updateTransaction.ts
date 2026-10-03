import type { LedgerUnitOfWork, TransactionEditInput, TransactionRecord } from "@/domain/ledger/ports";
import { InvalidTransactionError, assertValidAmountCents, assertValidIsoDate, classifyFlow } from "@/domain/ledger/rules";
import { applyTransactionDelta } from "./applyTransactionDelta";

export interface UpdateTransactionInput extends TransactionEditInput {
  id: number;
}

export class UpdateTransactionUseCase {
  constructor(private readonly uow: LedgerUnitOfWork) {}

  async execute(input: UpdateTransactionInput): Promise<TransactionRecord> {
    assertValidAmountCents(input.amountCents);
    assertValidIsoDate(input.date);
    if (!input.name.trim()) {
      throw new InvalidTransactionError("name no puede estar vacío");
    }

    return this.uow.run(async (ops) => {
      const existing = await ops.getTransaction(input.id);
      if (!existing) {
        throw new InvalidTransactionError(`la transacción ${input.id} no existe`);
      }

      const newAccount = await ops.getAccount(input.accountId);
      if (!newAccount) {
        throw new InvalidTransactionError(`la cuenta ${input.accountId} no existe`);
      }
      if (!newAccount.isActive) {
        throw new InvalidTransactionError(`la cuenta ${input.accountId} está inactiva`);
      }

      const oldAccount = await ops.getAccount(existing.accountId);
      if (oldAccount) {
        await applyTransactionDelta(ops, {
          familyId: oldAccount.familyId,
          accountId: existing.accountId,
          date: existing.date,
          amountCents: -existing.amountCents,
          categoryId: existing.categoryId ?? null,
          kind: existing.kind,
          flow: classifyFlow(existing.amountCents),
        });
      }

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
