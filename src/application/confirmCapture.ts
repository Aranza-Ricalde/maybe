import type { CaptureRepository } from "@/domain/captures/ports";
import { InvalidCaptureError } from "@/domain/captures/rules";
import { InvalidTransactionError } from "@/domain/ledger/rules";
import type { LedgerUnitOfWork } from "@/domain/ledger/ports";
import type { ResolveTransferSuggestionUseCase } from "./resolveTransferSuggestion";
import type { UpdateTransactionUseCase } from "./updateTransaction";

export class ConfirmCaptureUseCase {
  constructor(
    private readonly captures: CaptureRepository,
    private readonly uow: LedgerUnitOfWork,
    private readonly updateTransaction: UpdateTransactionUseCase,
    private readonly transfers: Pick<ResolveTransferSuggestionUseCase, "confirmSingle">,
  ) {}

  async executeAsTransfer(familyId: number, transactionId: number, kind: string): Promise<void> {
    if (!(await this.captures.isPending(familyId, transactionId))) throw new InvalidCaptureError("El movimiento ya no está por confirmar.");
    await this.transfers.confirmSingle(familyId, transactionId, kind);
    await this.captures.markConfirmed(familyId, transactionId);
  }

  async execute(familyId: number, transactionId: number, categoryId: number | null): Promise<void> {
    if (!(await this.captures.isPending(familyId, transactionId))) throw new InvalidCaptureError("El movimiento ya no está por confirmar.");

    if (categoryId != null) {
      const tx = await this.uow.run((ops) => ops.getTransaction(transactionId));
      if (!tx) throw new InvalidTransactionError(`la transacción ${transactionId} no existe`);
      if (tx.categoryId !== categoryId) {
        await this.updateTransaction.execute({ id: tx.id, accountId: tx.accountId, date: tx.date, amountCents: tx.amountCents, name: tx.name, categoryId, conceptId: tx.conceptId });
      }
    }
    await this.captures.markConfirmed(familyId, transactionId);
  }
}
