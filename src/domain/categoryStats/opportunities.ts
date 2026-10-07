import type { CategoryStats } from "./rules";

export const DEFAULT_CUT_PERCENT = 10;
export const MAX_OPPORTUNITIES = 3;

export interface SavingsOpportunity {
  categoryId: number;
  name: string;
  discretionaryMonthlyCents: number;
}

export interface DiscretionaryActions {
  discretionaryMonthlyCents: number;
  cutPercent: number;
  monthlySavingCents: number;
  yearlySavingCents: number;
  opportunities: SavingsOpportunity[];
}

export function discretionaryActions(stats: Pick<CategoryStats, "rows" | "natures">, cutPercent: number = DEFAULT_CUT_PERCENT): DiscretionaryActions | null {
  const discretionary = stats.natures.find((n) => n.nature === "discretionary");
  if (!discretionary || discretionary.avgLast3Cents <= 0) return null;

  const opportunities = stats.rows
    .filter((row) => row.depth === 0 && row.categoryId > 0)
    .map((row) => ({ categoryId: row.categoryId, name: row.name, discretionaryMonthlyCents: Math.round(row.avgLast3Cents * row.discretionaryShare) }))
    .filter((row) => row.discretionaryMonthlyCents > 0)
    .sort((a, b) => b.discretionaryMonthlyCents - a.discretionaryMonthlyCents)
    .slice(0, MAX_OPPORTUNITIES);

  const monthlySavingCents = Math.round((discretionary.avgLast3Cents * cutPercent) / 100);
  return { discretionaryMonthlyCents: discretionary.avgLast3Cents, cutPercent, monthlySavingCents, yearlySavingCents: monthlySavingCents * 12, opportunities };
}
