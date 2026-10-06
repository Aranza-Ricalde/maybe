import type { CategoryStatsRepository } from "@/domain/categoryStats/ports";
import { buildCategoryStats, statMonths, type CategoryStats } from "@/domain/categoryStats/rules";
import { endOfMonth } from "@/domain/cashflow/rules";
import { assertValidIsoDate } from "@/domain/ledger/rules";

export class GetCategoryStatsUseCase {
  constructor(private readonly repo: CategoryStatsRepository) {}

  async execute(familyId: number, today: string): Promise<CategoryStats> {
    assertValidIsoDate(today);
    const months = statMonths(today);
    const [categories, spend] = await Promise.all([
      this.repo.listCategories(familyId),
      this.repo.getMonthlySpend(familyId, months[0], endOfMonth(months[months.length - 1])),
    ]);
    return buildCategoryStats({ categories, spend, today });
  }
}
