import { endOfMonth } from "@/domain/cashflow/rules";
import type { CategoryStatsRepository } from "@/domain/categoryStats/ports";
import { shiftMonth } from "@/domain/dashboard/rules";
import type { InsightsRepository } from "@/domain/insights/ports";
import { monthStart } from "@/domain/ledger/rules";
import type { SpendingAnalysisRepository } from "@/domain/spendingAnalysis/ports";
import {
  MERCHANT_MONTHS,
  rankMerchants,
  smallExpenseSummary,
  subscriptionCategoryIds,
  subscriptionSummary,
  type MerchantRank,
  type SmallExpenseSummary,
  type SubscriptionSummary,
} from "@/domain/spendingAnalysis/rules";

export interface SpendingAnalysisView {
  small: SmallExpenseSummary | null;
  merchants: MerchantRank[];
  subscriptions: SubscriptionSummary | null;
  monthsAnalyzed: number;
}

export class GetSpendingAnalysisUseCase {
  constructor(
    private readonly insights: InsightsRepository,
    private readonly analysis: SpendingAnalysisRepository,
    private readonly categories: CategoryStatsRepository,
  ) {}

  async execute(familyId: number, today: string): Promise<SpendingAnalysisView> {
    const current = monthStart(today);
    const windowFrom = shiftMonth(current, -MERCHANT_MONTHS);
    const windowTo = endOfMonth(shiftMonth(current, -1));

    const [expenses, merchantRows, monthsAnalyzed, categories] = await Promise.all([
      this.insights.listExpensesSince(familyId, shiftMonth(current, -2)),
      this.analysis.listMerchantSpend(familyId, windowFrom, windowTo),
      this.analysis.countMonthsWithSpend(familyId, windowFrom, windowTo),
      this.categories.listCategories(familyId),
    ]);

    return {
      small: smallExpenseSummary(expenses, today),
      merchants: rankMerchants(merchantRows),
      subscriptions: subscriptionSummary(merchantRows, subscriptionCategoryIds(categories), monthsAnalyzed),
      monthsAnalyzed,
    };
  }
}
