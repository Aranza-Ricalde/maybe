import type { CapturedTransactionView, CaptureRepository } from "@/domain/captures/ports";
import { InvalidCaptureError } from "@/domain/captures/rules";
import type { LedgerUnitOfWork } from "@/domain/ledger/ports";
import { classifyFlow } from "@/domain/ledger/rules";
import type { CategoriesReader } from "@/domain/readModels/ports";
import type { DeleteTransactionUseCase } from "./deleteTransaction";
import type { UpdateTransactionUseCase } from "./updateTransaction";

export class CorrectCaptureUseCase {
  constructor(
    private readonly captures: CaptureRepository,
    private readonly categories: CategoriesReader,
    private readonly uow: LedgerUnitOfWork,
    private readonly updateTransaction: UpdateTransactionUseCase,
    private readonly deleteTransaction: DeleteTransactionUseCase,
  ) {}

  async find(familyId: number, transactionId: number): Promise<CapturedTransactionView> {
    const view = await this.captures.findCaptured(familyId, transactionId);
    if (!view) throw new InvalidCaptureError("El movimiento ya no existe.");
    return view;
  }

  async confirm(familyId: number, transactionId: number): Promise<CapturedTransactionView> {
    await this.find(familyId, transactionId);
    if (await this.captures.isPending(familyId, transactionId)) await this.captures.markConfirmed(familyId, transactionId);
    return this.find(familyId, transactionId);
  }

  async setCategory(familyId: number, transactionId: number, categoryId: number): Promise<CapturedTransactionView> {
    const view = await this.find(familyId, transactionId);
    const category = (await this.categories.list(familyId)).find((candidate) => candidate.id === categoryId);
    if (!category || category.classification !== classifyFlow(view.amountCents)) throw new InvalidCaptureError("Esa categoría no aplica a este movimiento.");

    const tx = await this.uow.run((ops) => ops.getTransaction(transactionId));
    if (!tx) throw new InvalidCaptureError("El movimiento ya no existe.");
    if (tx.categoryId !== categoryId) {
      await this.updateTransaction.execute({ id: tx.id, accountId: tx.accountId, date: tx.date, amountCents: tx.amountCents, name: tx.name, categoryId, conceptId: tx.conceptId });
    }
    return this.confirm(familyId, transactionId);
  }

  async undo(familyId: number, transactionId: number): Promise<CapturedTransactionView> {
    const view = await this.find(familyId, transactionId);
    await this.deleteTransaction.execute(transactionId);
    return view;
  }

  async suggestedCategories(familyId: number, transactionId: number, limit: number) {
    const view = await this.find(familyId, transactionId);
    return this.captures.topCategories(familyId, classifyFlow(view.amountCents), limit);
  }
}
