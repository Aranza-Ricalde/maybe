import type { CategoryUsageRepository } from "@/domain/categories/ports";
import { learnCategoryFromUsage, type LearnedCategory } from "@/domain/categories/learning";
import { classifyFlow } from "@/domain/ledger/rules";

export class LearnTransactionCategoryUseCase {
  constructor(private readonly usage: CategoryUsageRepository) {}

  async execute(input: { familyId: number; providerId: number | null; amountCents: number }): Promise<LearnedCategory | null> {
    if (input.providerId == null) return null;
    const usage = await this.usage.listUsageByProvider(input.familyId, input.providerId, classifyFlow(input.amountCents));
    return learnCategoryFromUsage(usage);
  }
}
