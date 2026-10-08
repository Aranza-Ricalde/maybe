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

export interface GoalRing {
  key: string;
  name: string;
  percent: number;
  fill: string;
}

export function goalRings(goals: Array<{ id: number; name: string; currentCents: number; targetAmountCents: number }>, limit = 5): GoalRing[] {
  return goals
    .filter((goal) => goal.targetAmountCents > 0)
    .map((goal) => ({ id: goal.id, name: goal.name, percent: Math.round(Math.min(1, Math.max(0, goal.currentCents) / goal.targetAmountCents) * 100) }))
    .slice(0, limit)
    .map((goal, index) => ({ key: `g${goal.id}`, name: goal.name, percent: goal.percent, fill: CHART_COLOR_VARS[index % CHART_COLOR_VARS.length] }));
}

export interface WaterfallStep {
  label: string;
  kind: "total" | "increase" | "decrease";
  base: number;
  value: number;
}

export function waterfallSteps(input: { previousCents: number; currentCents: number; drivers: Array<{ name: string; deltaCents: number }> }, limit = 5): WaterfallStep[] {
  const drivers = input.drivers.filter((driver) => driver.deltaCents !== 0).slice(0, limit);
  const explained = drivers.reduce((sum, driver) => sum + driver.deltaCents, 0);
  const rest = input.currentCents - input.previousCents - explained;
  const deltas = rest === 0 ? drivers : [...drivers, { name: "Otros", deltaCents: rest }];

  const steps: WaterfallStep[] = [{ label: "Periodo anterior", kind: "total", base: 0, value: input.previousCents }];
  let running = input.previousCents;
  for (const delta of deltas) {
    const after = running + delta.deltaCents;
    steps.push({ label: delta.name, kind: delta.deltaCents > 0 ? "increase" : "decrease", base: Math.min(running, after), value: Math.abs(delta.deltaCents) });
    running = after;
  }
  steps.push({ label: "Este periodo", kind: "total", base: 0, value: input.currentCents });
  return steps;
}
