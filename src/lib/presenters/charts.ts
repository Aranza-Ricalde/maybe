
export const CHART_COLOR_VARS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"] as const;
const CATEGORY_RAMP = [100, 72, 52, 36, 24] as const;
export const CATEGORY_COLORS = CATEGORY_RAMP.map((weight) => `color-mix(in oklab, var(--primary) ${weight}%, var(--card))`);
export const OTHERS_COLOR = "color-mix(in oklab, var(--muted-foreground) 45%, var(--card))";

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
