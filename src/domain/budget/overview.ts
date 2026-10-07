import { resolveCategoryDescription, type ResolvedCategoryDescription } from "@/domain/categories/descriptions";
import { orderCategoriesAsTree } from "@/domain/categories/rules";
import { indexBy } from "@/domain/shared/collections";
import { composeEffectiveBudgets, rollUpBudgetHierarchy, totalBudgetedCents, type BudgetCadence, type BudgetCategorySettingInput, type BudgetHierarchyLine, type BudgetPeriod, type RecurringBudgetContributionInput } from "./rules";

export interface BudgetOverviewInput {
  categories: Array<{ id: number; parentId: number | null }>;
  settings: BudgetCategorySettingInput[];
  recurringItems: RecurringBudgetContributionInput[];
  periods: BudgetPeriod[];
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
  ownCapCents: number;
  unallocatedCents: number;
  isRaisedByChildren: boolean;
  isDerivedFromChildren: boolean;
  isSuggestedByRecurring: boolean;
  parentId: number | null;
  hasChildren: boolean;
  origin: BudgetOrigin;
  description: ResolvedCategoryDescription;
}

export type BudgetOrigin =
  | { kind: "none" }
  | { kind: "manual"; amountCents: number; cadence: BudgetCadence }
  | { kind: "recurring" }
  | { kind: "children" }
  | { kind: "raised"; ownCapCents: number }
  | { kind: "cap"; amountCents: number; cadence: BudgetCadence; unallocatedCents: number };

export function budgetOriginOf(args: { manualAmountCents: number; cadence: BudgetCadence; effectiveCents: number; hasChildren: boolean; isDerivedFromChildren: boolean; isRaisedByChildren: boolean; ownCapCents: number; unallocatedCents: number }): BudgetOrigin {
  if (args.effectiveCents <= 0) return { kind: "none" };
  if (args.isRaisedByChildren) return { kind: "raised", ownCapCents: args.ownCapCents };
  if (args.manualAmountCents > 0 && args.hasChildren) return { kind: "cap", amountCents: args.manualAmountCents, cadence: args.cadence, unallocatedCents: args.unallocatedCents };
  if (args.manualAmountCents > 0) return { kind: "manual", amountCents: args.manualAmountCents, cadence: args.cadence };
  if (args.isDerivedFromChildren) return { kind: "children" };
  return { kind: "recurring" };
}

export function budgetTableRows(
  categories: Array<{ id: number; name: string; color: string; parentId: number | null; description?: string | null }>,
  settings: BudgetCategorySettingInput[],
  hierarchy: BudgetHierarchyLine[],
): BudgetTableRow[] {
  const manualByCategory = indexBy(settings, (setting) => setting.categoryId);
  const lineByCategory = indexBy(hierarchy, (line) => line.categoryId);
  return orderCategoriesAsTree(categories).map((category) => {
    const manual = manualByCategory.get(category.id);
    const line = lineByCategory.get(category.id);
    const isDerivedFromChildren = line?.isDerivedFromChildren ?? false;
    const effectiveBudgetedCents = line?.targetCents ?? 0;
    const origin = budgetOriginOf({
      manualAmountCents: manual?.budgetedAmountCents ?? 0,
      cadence: manual?.cadence ?? "monthly",
      effectiveCents: effectiveBudgetedCents,
      hasChildren: category.hasChildren,
      isDerivedFromChildren,
      isRaisedByChildren: line?.isRaisedByChildren ?? false,
      ownCapCents: line?.ownCapCents ?? 0,
      unallocatedCents: line?.unallocatedCents ?? 0,
    });
    return {
      categoryId: category.id,
      name: category.name,
      color: category.color,
      cadence: manual?.cadence ?? "monthly",
      manualBudgetedAmountCents: manual?.budgetedAmountCents ?? 0,
      effectiveBudgetedCents,
      actualCents: line?.actualCents ?? 0,
      depth: category.depth,
      childrenAllocatedCents: line?.childrenAllocatedCents ?? 0,
      ownCapCents: line?.ownCapCents ?? 0,
      unallocatedCents: line?.unallocatedCents ?? 0,
      isRaisedByChildren: line?.isRaisedByChildren ?? false,
      isDerivedFromChildren,
      isSuggestedByRecurring: manual == null && effectiveBudgetedCents > 0 && !isDerivedFromChildren,
      parentId: category.depth === 1 ? category.parentId : null,
      hasChildren: category.hasChildren,
      origin,
      description: resolveCategoryDescription(category.name, category.description),
    };
  });
}

export interface BudgetSummary {
  budgetedCents: number;
  spentCents: number;
  overCount: number;
}

export function summarizeBudget(rows: Array<Pick<BudgetTableRow, "depth" | "effectiveBudgetedCents" | "actualCents">>): BudgetSummary {
  const roots = rows.filter((row) => row.depth === 0 && row.effectiveBudgetedCents > 0);
  return {
    budgetedCents: roots.reduce((sum, row) => sum + row.effectiveBudgetedCents, 0),
    spentCents: roots.reduce((sum, row) => sum + Math.abs(row.actualCents), 0),
    overCount: rows.filter((row) => row.effectiveBudgetedCents > 0 && Math.abs(row.actualCents) > row.effectiveBudgetedCents).length,
  };
}

export function budgetScopeNote(monthShare: number, periodCount: number): string {
  if (Math.abs(monthShare - 1) < 1e-9) return "Estás viendo el mes completo: cada presupuesto mensual cuenta completo.";
  if (Math.abs(monthShare - 0.5) < 1e-9 && periodCount === 1) return "Estás viendo una quincena, la mitad del mes: cada presupuesto mensual cuenta la mitad. Uno quincenal cuenta completo.";
  const percent = Math.round(monthShare * 100);
  return `Estás viendo ${periodCount} ${periodCount === 1 ? "periodo" : "periodos"}, el ${percent}% de un mes: cada presupuesto mensual cuenta ese porcentaje.`;
}
