import type { CategoryStats } from "@/domain/categoryStats/rules";
import type { ExplorerShare } from "@/domain/explorer/rules";
import { formatMonthYearShort } from "@/lib/format";

export const CHART_COLOR_VARS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"] as const;
export const OTHERS_KEY = "otras";
export const OTHERS_COLOR = "var(--muted-foreground)";

export interface StackedSeriesKey {
  key: string;
  label: string;
  color: string;
}

export interface StackedSpending {
  keys: StackedSeriesKey[];
  data: Array<Record<string, string | number>>;
}

const seriesKeyOf = (categoryId: number) => `c${categoryId}`;

export function stackedSpendingSeries(stats: Pick<CategoryStats, "months" | "rows">, topN = 4): StackedSpending {
  const parents = stats.rows.filter((row) => row.depth === 0).sort((a, b) => b.windowCents - a.windowCents);
  const top = parents.slice(0, topN);
  const rest = parents.slice(topN);
  const keys: StackedSeriesKey[] = top.map((row, index) => ({ key: seriesKeyOf(row.categoryId), label: row.name, color: CHART_COLOR_VARS[index % CHART_COLOR_VARS.length] }));
  if (rest.length > 0) keys.push({ key: OTHERS_KEY, label: "Otras", color: OTHERS_COLOR });

  const data = stats.months.map((month, index) => {
    const point: Record<string, string | number> = { month: formatMonthYearShort(month) };
    for (const row of top) point[seriesKeyOf(row.categoryId)] = row.seriesCents[index] ?? 0;
    if (rest.length > 0) point[OTHERS_KEY] = rest.reduce((sum, row) => sum + (row.seriesCents[index] ?? 0), 0);
    return point;
  });
  return { keys, data };
}

export interface BudgetBar {
  name: string;
  budgetCents: number;
  actualCents: number;
  over: boolean;
}

export function budgetVsActualBars(rows: Array<{ depth: number; name: string; effectiveBudgetedCents: number; actualCents: number }>, limit = 8): BudgetBar[] {
  return rows
    .filter((row) => row.depth === 0 && (row.effectiveBudgetedCents > 0 || Math.abs(row.actualCents) > 0))
    .map((row) => ({ name: row.name, budgetCents: row.effectiveBudgetedCents, actualCents: Math.abs(row.actualCents), over: row.effectiveBudgetedCents > 0 && Math.abs(row.actualCents) > row.effectiveBudgetedCents }))
    .sort((a, b) => Math.max(b.budgetCents, b.actualCents) - Math.max(a.budgetCents, a.actualCents))
    .slice(0, limit);
}

export interface DonutSlice {
  key: string;
  name: string;
  value: number;
  fill: string;
}

export function donutSlices(shares: ExplorerShare[]): DonutSlice[] {
  return shares
    .filter((share) => share.totalCents > 0)
    .map((share, index) => ({ key: share.key, name: share.name, value: share.totalCents, fill: share.color ?? CHART_COLOR_VARS[index % CHART_COLOR_VARS.length] }));
}
