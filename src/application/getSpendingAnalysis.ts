import { endOfMonth } from "@/domain/cashflow/rules";
import type { CategoryStatsRepository } from "@/domain/categoryStats/ports";
import { shiftMonth } from "@/domain/dashboard/rules";
import type { InsightsRepository } from "@/domain/insights/ports";
import { monthStart } from "@/domain/ledger/rules";
import type { SpendingAnalysisRepository, SubscriptionGroupsRepository } from "@/domain/spendingAnalysis/ports";
import {
  MERCHANT_MONTHS,
  rankMerchants,
  smallExpenseSummary,
  type MerchantRanking,
  type SmallExpenseSummary,
} from "@/domain/spendingAnalysis/rules";
import { subscriptionCategoryIds, subscriptionSummary, type SubscriptionSummary } from "@/domain/spendingAnalysis/subscriptions";

export interface SpendingAnalysisView {
  small: SmallExpenseSummary | null;
  merchants: MerchantRanking;
  subscriptions: SubscriptionSummary | null;
  monthsAnalyzed: number;
}

export class GetSpendingAnalysisUseCase {
  constructor(
    private readonly insights: InsightsRepository,
    private readonly analysis: SpendingAnalysisRepository,
    private readonly categories: CategoryStatsRepository,
    private readonly subscriptionGroups: SubscriptionGroupsRepository,
  ) {}

  async execute(familyId: number, today: string): Promise<SpendingAnalysisView> {
    const current = monthStart(today);
    const windowFrom = shiftMonth(current, -MERCHANT_MONTHS);
    const windowTo = endOfMonth(shiftMonth(current, -1));

    const [expenses, merchantRows, monthsAnalyzed, categories, aliases] = await Promise.all([
      this.insights.listExpensesSince(familyId, shiftMonth(current, -2)),
      this.analysis.listMerchantSpend(familyId, windowFrom, windowTo),
      this.analysis.countMonthsWithSpend(familyId, windowFrom, windowTo),
      this.categories.listCategories(familyId),
      this.subscriptionGroups.listAliases(familyId),
    ]);

    return {
      small: smallExpenseSummary(expenses, today),
      merchants: rankMerchants(merchantRows),
      subscriptions: subscriptionSummary(merchantRows, subscriptionCategoryIds(categories), monthsAnalyzed, aliases),
      monthsAnalyzed,
    };
  }
}
