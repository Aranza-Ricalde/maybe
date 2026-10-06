import type { LedgerUnitOfWork } from "@/domain/ledger/ports";
import { reverseTransaction } from "./applyTransactionDelta";

export class DeleteTransactionUseCase {
  constructor(private readonly uow: LedgerUnitOfWork) {}

  async execute(id: number): Promise<void> {
    await this.uow.run(async (ops) => {
      const existing = await ops.getTransaction(id);
      if (!existing) return;

      await reverseTransaction(ops, existing);
      await ops.deleteTransactionRow(id);
    });
  }
}
