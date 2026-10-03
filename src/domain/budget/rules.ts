import { resolveDayOfMonthWithinRange } from "@/domain/payPeriod/rules";

export const BUDGET_CADENCES = ["monthly", "biweekly"] as const;
export type BudgetCadence = (typeof BUDGET_CADENCES)[number];

export function effectiveBudgetTargetCents(cadence: BudgetCadence, budgetedAmountCents: number, periodsInView: number): number {
  return cadence === "biweekly" ? budgetedAmountCents * periodsInView : budgetedAmountCents;
}

export interface RecurringBudgetContributionInput {
  categoryId: number | null;
  dayOfMonth: number;
  estimatedAmountCents: number;
  flow: "income" | "expense";
  status: "active" | "paused";
}

export function recurringContributionsByCategory(
  recurringItems: RecurringBudgetContributionInput[],
  periods: { start: string; end: string }[],
): Map<number, number> {
  const totals = new Map<number, number>();
  for (const item of recurringItems) {
    if (item.status !== "active" || item.flow !== "expense" || item.categoryId == null) continue;
    for (const period of periods) {
      if (resolveDayOfMonthWithinRange(item.dayOfMonth, period.start, period.end)) {
        totals.set(item.categoryId, (totals.get(item.categoryId) ?? 0) + Math.abs(item.estimatedAmountCents));
      }
    }
  }
  return totals;
}

export interface BudgetCategorySettingInput {
  categoryId: number;
  cadence: BudgetCadence;
  budgetedAmountCents: number;
}

export interface EffectiveBudgetLine {
  categoryId: number;
  targetCents: number;
}

export function composeEffectiveBudgets(
  settings: BudgetCategorySettingInput[],
  recurringItems: RecurringBudgetContributionInput[],
  periods: { start: string; end: string }[],
): EffectiveBudgetLine[] {
  const byCategory = new Map<number, number>();
  for (const s of settings) {
    byCategory.set(s.categoryId, effectiveBudgetTargetCents(s.cadence, s.budgetedAmountCents, periods.length));
  }
  for (const [categoryId, amount] of recurringContributionsByCategory(recurringItems, periods)) {
    byCategory.set(categoryId, (byCategory.get(categoryId) ?? 0) + amount);
  }
  return [...byCategory.entries()].map(([categoryId, targetCents]) => ({ categoryId, targetCents }));
}

export interface CategoryBudgetInput {
  categoryId: number;
  name: string;
  color: string;
  budgetedCents: number;
  actualCents: number;
}

export interface CategoryBudgetResult extends CategoryBudgetInput {
  spentCents: number;
  percent: number | null;
  isOverBudget: boolean;
  /** spentCents - budgetedCents: positivo = por encima del presupuesto, negativo = disponible restante. */
  deviationCents: number;
}

export function computeBudgetPercent(budgetedCents: number, actualCents: number): number | null {
  return budgetedCents > 0 ? Math.abs(actualCents) / budgetedCents : null;
}

export type BudgetProgressTone = "success" | "warning" | "danger";

const NEAR_LIMIT_THRESHOLD = 0.8;

export function classifyBudgetProgress(percent: number): BudgetProgressTone {
  if (percent > 1) return "danger";
  if (percent >= NEAR_LIMIT_THRESHOLD) return "warning";
  return "success";
}

function withComputedFields(c: CategoryBudgetInput): CategoryBudgetResult {
  const spentCents = Math.abs(c.actualCents);
  const percent = computeBudgetPercent(c.budgetedCents, c.actualCents);
  return { ...c, spentCents, percent, isOverBudget: percent !== null && percent > 1, deviationCents: spentCents - c.budgetedCents };
}

function byRelevance(a: CategoryBudgetResult, b: CategoryBudgetResult): number {
  if (a.isOverBudget !== b.isOverBudget) return a.isOverBudget ? -1 : 1;
  const aPercent = a.percent ?? -1;
  const bPercent = b.percent ?? -1;
  if (aPercent !== bPercent) return bPercent - aPercent;
  return b.spentCents - a.spentCents;
}

export function topCategoryBudgets(categories: CategoryBudgetInput[], limit: number): CategoryBudgetResult[] {
  return categories
    .filter((c) => c.budgetedCents > 0)
    .map(withComputedFields)
    .sort(byRelevance)
    .slice(0, limit);
}

export class InvalidBudgetError extends Error {}

export function assertValidBudgetedAmountCents(amountCents: number): void {
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new InvalidBudgetError("El monto presupuestado debe ser mayor a 0.");
  }
}
