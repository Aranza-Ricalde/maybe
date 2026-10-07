import { resolveDayOfMonthWithinRange } from "@/domain/payPeriod/rules";
import { countsTowardBudget } from "@/domain/recurring/budgetInclusion";
import { groupBy } from "@/domain/shared/collections";

export const BUDGET_CADENCES = ["monthly", "biweekly"] as const;
export type BudgetCadence = (typeof BUDGET_CADENCES)[number];

export interface BudgetPeriod {
  start: string;
  end: string;
  monthShare: number;
}

export function monthShareCovered(periods: Array<Pick<BudgetPeriod, "monthShare">>): number {
  return periods.reduce((sum, period) => sum + period.monthShare, 0);
}

export function effectiveBudgetTargetCents(cadence: BudgetCadence, budgetedAmountCents: number, periods: Array<Pick<BudgetPeriod, "monthShare">>): number {
  return cadence === "biweekly" ? budgetedAmountCents * periods.length : Math.round(budgetedAmountCents * monthShareCovered(periods));
}

export interface RecurringBudgetContributionInput {
  categoryId: number | null;
  dayOfMonth: number;
  estimatedAmountCents: number;
  flow: "income" | "expense";
  status: "active" | "paused";
  budgetInclusion?: string | null;
}

export function recurringContributionsByCategory(
  recurringItems: RecurringBudgetContributionInput[],
  periods: { start: string; end: string }[],
): Map<number, number> {
  const totals = new Map<number, number>();
  for (const item of recurringItems) {
    if (item.status !== "active" || item.flow !== "expense" || item.categoryId == null) continue;
    if (!countsTowardBudget(item)) continue;
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

export function composeEffectiveBudgets(settings: BudgetCategorySettingInput[], recurringItems: RecurringBudgetContributionInput[], periods: BudgetPeriod[]): EffectiveBudgetLine[] {
  const byCategory = new Map<number, number>();
  for (const s of settings) {
    byCategory.set(s.categoryId, effectiveBudgetTargetCents(s.cadence, s.budgetedAmountCents, periods));
  }
  for (const [categoryId, amount] of recurringContributionsByCategory(recurringItems, periods)) {
    if (!byCategory.has(categoryId)) byCategory.set(categoryId, amount);
  }
  return [...byCategory.entries()].map(([categoryId, targetCents]) => ({ categoryId, targetCents }));
}

export interface BudgetHierarchyCategory {
  id: number;
  parentId: number | null;
}

export interface BudgetHierarchyInput {
  categories: BudgetHierarchyCategory[];
  effectiveTargets: Map<number, number>;
  manualCategoryIds: Set<number>;
  actuals: Map<number, number>;
}

export interface BudgetHierarchyLine {
  categoryId: number;
  parentId: number | null;
  targetCents: number;
  actualCents: number;
  childrenAllocatedCents: number;
  ownCapCents: number;
  unallocatedCents: number;
  isRaisedByChildren: boolean;
  isDerivedFromChildren: boolean;
}

export function rollUpBudgetHierarchy(input: BudgetHierarchyInput): BudgetHierarchyLine[] {
  const ids = new Set(input.categories.map((c) => c.id));
  const isChild = (c: BudgetHierarchyCategory) => c.parentId != null && c.parentId !== c.id && ids.has(c.parentId);
  const childrenOf = new Map<number, number[]>();
  for (const [parentId, children] of groupBy(input.categories.filter(isChild), (c) => c.parentId as number)) childrenOf.set(parentId, children.map((c) => c.id));
  const target = (id: number) => input.effectiveTargets.get(id) ?? 0;
  const actual = (id: number) => input.actuals.get(id) ?? 0;

  return input.categories.map((c) => {
    if (isChild(c)) {
      return {
        categoryId: c.id,
        parentId: c.parentId,
        targetCents: target(c.id),
        actualCents: actual(c.id),
        childrenAllocatedCents: 0,
        ownCapCents: 0,
        unallocatedCents: 0,
        isRaisedByChildren: false,
        isDerivedFromChildren: false,
      };
    }

    const children = childrenOf.get(c.id) ?? [];
    const childrenAllocatedCents = children.reduce((sum, id) => sum + target(id), 0);
    const hasOwnCap = input.manualCategoryIds.has(c.id);
    const isDerivedFromChildren = children.length > 0 && !hasOwnCap && childrenAllocatedCents > 0;

    const ownCapCents = hasOwnCap ? target(c.id) : 0;
    return {
      categoryId: c.id,
      parentId: null,
      targetCents: hasOwnCap ? Math.max(ownCapCents, childrenAllocatedCents) : target(c.id) + childrenAllocatedCents,
      actualCents: actual(c.id) + children.reduce((sum, id) => sum + actual(id), 0),
      childrenAllocatedCents,
      ownCapCents,
      unallocatedCents: hasOwnCap ? Math.max(0, ownCapCents - childrenAllocatedCents) : 0,
      isRaisedByChildren: hasOwnCap && childrenAllocatedCents > ownCapCents,
      isDerivedFromChildren,
    };
  });
}

export function totalBudgetedCents(lines: BudgetHierarchyLine[]): number | null {
  const roots = lines.filter((l) => l.parentId == null && l.targetCents > 0);
  return roots.length > 0 ? roots.reduce((sum, l) => sum + l.targetCents, 0) : null;
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

export function assertValidBudgetCadence(cadence: string): asserts cadence is BudgetCadence {
  if (!BUDGET_CADENCES.includes(cadence as BudgetCadence)) {
    throw new InvalidBudgetError(`Periodicidad de presupuesto inválida: "${cadence}".`);
  }
}

export function assertValidBudgetedAmountCents(amountCents: number): void {
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new InvalidBudgetError("El monto presupuestado debe ser mayor a 0.");
  }
}
