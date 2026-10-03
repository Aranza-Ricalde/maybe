import type { LedgerUnitOfWork } from "@/domain/ledger/ports";
import { classifyFlow } from "@/domain/ledger/rules";
import { applyTransactionDelta } from "./applyTransactionDelta";

export class DeleteTransactionUseCase {
  constructor(private readonly uow: LedgerUnitOfWork) {}

  async execute(id: number): Promise<void> {
    await this.uow.run(async (ops) => {
      const existing = await ops.getTransaction(id);
      if (!existing) return;

      const account = await ops.getAccount(existing.accountId);
      if (account) {
        await applyTransactionDelta(ops, {
          familyId: account.familyId,
          accountId: existing.accountId,
          date: existing.date,
          amountCents: -existing.amountCents,
          categoryId: existing.categoryId ?? null,
          kind: existing.kind,
          flow: classifyFlow(existing.amountCents),
        });
      }

      await ops.deleteTransactionRow(id);
    });
  }
}
