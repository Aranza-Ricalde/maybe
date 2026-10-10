import type { UncategorizedTransactionsRepository } from "@/domain/categories/ports";
import { InvalidCategoryReviewError, reviewGroupOf } from "@/domain/categories/reviewQueue";
import type { Flow } from "@/domain/ledger/rules";
import type { CategoriesReader } from "@/domain/readModels/ports";
import type { SuggestedTransferKind } from "@/domain/transfers/detectionModel";
import type { ResolveTransferSuggestionUseCase } from "./resolveTransferSuggestion";
import type { UpdateTransactionUseCase } from "./updateTransaction";

export type ReviewDecision = { categoryId: number } | { transferKind: SuggestedTransferKind };

export class CategorizeProviderUseCase {
  constructor(
    private readonly pending: UncategorizedTransactionsRepository,
    private readonly categories: Pick<CategoriesReader, "list">,
    private readonly update: Pick<UpdateTransactionUseCase, "executeMany">,
    private readonly transfers: Pick<ResolveTransferSuggestionUseCase, "confirmSingle">,
  ) {}

  async execute(familyId: number, input: { providerId: number; flow: Flow; hintKey: string; decision: ReviewDecision }): Promise<{ updated: number }> {
    const { decision } = input;
    if ("categoryId" in decision) await this.assertCategory(familyId, decision.categoryId, input.flow);
    else if (input.flow === "income" && decision.transferKind !== "transfer") throw new InvalidCategoryReviewError("Un ingreso solo puede ser una transferencia entre tus cuentas.");

    const [pending, ownerNames] = await Promise.all([this.pending.listStandardUncategorized(familyId), this.pending.listOwnerNames(familyId)]);
    const rows = pending.filter((tx) => {
      if (tx.providerId !== input.providerId) return false;
      const group = reviewGroupOf(tx, ownerNames);
      return group.flow === input.flow && group.hintKey === input.hintKey;
    });
    if (rows.length === 0) throw new InvalidCategoryReviewError("Ese comercio ya no tiene movimientos por categorizar.");

    if ("categoryId" in decision) {
      const { categoryId } = decision;
      await this.update.executeMany(rows.map((tx) => ({ id: tx.id, accountId: tx.accountId, date: tx.date, amountCents: tx.amountCents, name: tx.name, categoryId })));
    } else {
      for (const tx of rows) await this.transfers.confirmSingle(familyId, tx.id, decision.transferKind);
    }
    return { updated: rows.length };
  }

  private async assertCategory(familyId: number, categoryId: number, flow: Flow): Promise<void> {
    const category = (await this.categories.list(familyId)).find((c) => c.id === categoryId);
    if (!category) throw new InvalidCategoryReviewError("La categoría ya no existe.");
    if (category.classification !== flow) throw new InvalidCategoryReviewError("La categoría no corresponde al tipo de movimiento (gasto o ingreso).");
  }
}
