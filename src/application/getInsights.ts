import type { InsightsRepository } from "@/domain/insights/ports";
import { UNUSUAL_HISTORY_DAYS, UNUSUAL_RECENT_DAYS, buildInsights, type Insight, type InsightGoal, type InsightOccurrence } from "@/domain/insights/rules";
import { addDays } from "@/domain/payPeriod/rules";
import type { CategoryStatsReader } from "@/domain/categoryStats/ports";
import type { GetTransferSuggestionsUseCase } from "./getTransferSuggestions";

export interface InsightsContext {
  savings: { rate: number | null; previousRate: number | null; savedCents: number };
  netWorthDeltaCents: number;
  occurrences: InsightOccurrence[];
  goals: InsightGoal[];
}

export class GetInsightsUseCase {
  constructor(
    private readonly repo: InsightsRepository,
    private readonly categoryStats: CategoryStatsReader,
    private readonly transferSuggestions: GetTransferSuggestionsUseCase,
  ) {}

  async execute(familyId: number, today: string, context: InsightsContext): Promise<Insight[]> {
    const [stats, expenses, uncategorized, suggestions] = await Promise.all([
      this.categoryStats.execute(familyId, today),
      this.repo.listExpensesSince(familyId, addDays(today, -(UNUSUAL_HISTORY_DAYS + UNUSUAL_RECENT_DAYS))),
      this.repo.getUncategorized(familyId),
      this.transferSuggestions.execute(familyId, today),
    ]);

    return buildInsights({
      today,
      stats,
      savings: context.savings,
      netWorthDeltaCents: context.netWorthDeltaCents,
      uncategorized,
      suspectedTransfers: suggestions.pairs.length * 2 + suggestions.singles.length,
      expenses,
      occurrences: context.occurrences,
      goals: context.goals,
    });
  }
}
