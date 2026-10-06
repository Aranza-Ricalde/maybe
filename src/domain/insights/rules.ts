import type { CategoryStats } from "@/domain/categoryStats/rules";
import { categoryChangeInsights, categoryStreakInsights, fastGrowthInsights } from "./categoryInsights";
import { MAX_INSIGHTS_PER_TONE, type Insight, type InsightTone } from "./model";
import { goalInsights, netWorthInsight, recurringPriceInsights, savingsInsights, suspectedTransfersInsight, uncategorizedInsight, type InsightGoal, type InsightOccurrence } from "./situationInsights";
import { duplicateInsights, unusualExpenseInsights, type InsightExpense } from "./spendingInsights";

export * from "./categoryInsights";
export * from "./model";
export * from "./situationInsights";
export * from "./spendingInsights";

export interface InsightsInput {
  today: string;
  stats: CategoryStats;
  savings: { rate: number | null; previousRate: number | null; savedCents: number };
  netWorthDeltaCents: number;
  uncategorized: { count: number; totalCents: number };
  suspectedTransfers: number;
  expenses: InsightExpense[];
  occurrences: InsightOccurrence[];
  goals: InsightGoal[];
}

const TONE_ORDER: InsightTone[] = ["change", "attention", "goal", "positive"];

export function buildInsights(input: InsightsInput): Insight[] {
  const changes = categoryChangeInsights(input.stats);
  const all = [
    ...changes,
    ...fastGrowthInsights(input.stats, new Set(changes.map((c) => Number(c.id.replace("category-change-", ""))))),
    ...categoryStreakInsights(input.stats),
    ...savingsInsights(input.savings),
    ...netWorthInsight(input.netWorthDeltaCents),
    ...uncategorizedInsight(input.uncategorized),
    ...suspectedTransfersInsight(input.suspectedTransfers),
    ...duplicateInsights(input.expenses, input.today),
    ...unusualExpenseInsights(input.expenses, input.today),
    ...recurringPriceInsights(input.occurrences, input.today),
    ...goalInsights(input.goals),
  ];
  return TONE_ORDER.flatMap((tone) =>
    all
      .filter((i) => i.tone === tone)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, MAX_INSIGHTS_PER_TONE[tone]),
  );
}

