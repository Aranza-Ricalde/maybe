import { orderCategoriesAsTree } from "@/domain/categories/rules";
import { indexBy } from "@/domain/shared/collections";
import { composeEffectiveBudgets, rollUpBudgetHierarchy, totalBudgetedCents, type BudgetCadence, type BudgetCategorySettingInput, type BudgetHierarchyLine, type RecurringBudgetContributionInput } from "./rules";

export interface BudgetOverviewInput {
  categories: Array<{ id: number; parentId: number | null }>;
  settings: BudgetCategorySettingInput[];
  recurringItems: RecurringBudgetContributionInput[];
  periods: Array<{ start: string; end: string }>;
  actuals: Array<{ categoryId: number; totalCents: number }>;
}

export interface BudgetOverview {
  hierarchy: BudgetHierarchyLine[];
  totalCents: number | null;
}

export function composeBudgetOverview(input: BudgetOverviewInput): BudgetOverview {
  const effectiveBudgets = composeEffectiveBudgets(input.settings, input.recurringItems, input.periods);
  const hierarchy = rollUpBudgetHierarchy({
    categories: input.categories.map((c) => ({ id: c.id, parentId: c.parentId })),
    effectiveTargets: new Map(effectiveBudgets.map((b) => [b.categoryId, b.targetCents])),
    manualCategoryIds: new Set(input.settings.map((s) => s.categoryId)),
    actuals: new Map(input.actuals.map((a) => [a.categoryId, a.totalCents])),
  });
  return { hierarchy, totalCents: totalBudgetedCents(hierarchy) };
}

export interface BudgetCategoryCard {
  categoryId: number;
  name: string;
  color: string;
  budgetedCents: number;
  actualCents: number;
}

const FALLBACK_CATEGORY_NAME = "Otro";
const FALLBACK_CATEGORY_COLOR = "#999999";

export function topLevelBudgetCards(hierarchy: BudgetHierarchyLine[], categories: Array<{ id: number; name: string; color: string | null }>): BudgetCategoryCard[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return hierarchy
    .filter((l) => l.parentId == null && l.targetCents > 0)
    .map((l) => ({
      categoryId: l.categoryId,
      name: byId.get(l.categoryId)?.name ?? FALLBACK_CATEGORY_NAME,
      color: byId.get(l.categoryId)?.color ?? FALLBACK_CATEGORY_COLOR,
      budgetedCents: l.targetCents,
      actualCents: l.actualCents,
    }));
}

export interface BudgetTableRow {
  categoryId: number;
  name: string;
  color: string;
  cadence: BudgetCadence;
  manualBudgetedAmountCents: number;
  effectiveBudgetedCents: number;
  actualCents: number;
  depth: 0 | 1;
  childrenAllocatedCents: number;
  isOverAllocated: boolean;
  isDerivedFromChildren: boolean;
}

export function budgetTableRows(
  categories: Array<{ id: number; name: string; color: string; parentId: number | null }>,
  settings: BudgetCategorySettingInput[],
  hierarchy: BudgetHierarchyLine[],
): BudgetTableRow[] {
  const manualByCategory = indexBy(settings, (setting) => setting.categoryId);
  const lineByCategory = indexBy(hierarchy, (line) => line.categoryId);
  return orderCategoriesAsTree(categories).map((category) => {
    const manual = manualByCategory.get(category.id);
    const line = lineByCategory.get(category.id);
    return {
      categoryId: category.id,
      name: category.name,
      color: category.color,
      cadence: manual?.cadence ?? "monthly",
      manualBudgetedAmountCents: manual?.budgetedAmountCents ?? 0,
      effectiveBudgetedCents: line?.targetCents ?? 0,
      actualCents: line?.actualCents ?? 0,
      depth: category.depth,
      childrenAllocatedCents: line?.childrenAllocatedCents ?? 0,
      isOverAllocated: line?.isOverAllocated ?? false,
      isDerivedFromChildren: line?.isDerivedFromChildren ?? false,
    };
  });
}
