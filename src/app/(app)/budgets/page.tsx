import { revalidatePath } from "next/cache";
import { isCategoryOwnedByFamily } from "@/app/lib/authorization";
import { requireUser } from "@/app/lib/dal";
import { getBudgetCategorySettings, getCategoryTotalsForDateRange, getFamilyCategories, getFamilyRecurringItems } from "@/app/lib/queries";
import { BudgetsPageTemplate } from "@/components/templates/BudgetsPageTemplate";
import { BUDGET_CADENCES, composeEffectiveBudgets } from "@/domain/budget/rules";
import { findPeriodIndexContaining, periodLabel, rangeFromPeriods } from "@/domain/payPeriod/rules";
import { deleteBudgetLineUseCase, listPayPeriodsUseCase, setBudgetLineUseCase } from "@/infrastructure/container";

async function setBudgetLine(formData: FormData) {
  "use server";
  const user = await requireUser();
  const categoryId = Number(formData.get("categoryId"));
  const cadenceInput = String(formData.get("cadence") ?? "");
  const amountInput = Number(formData.get("amount"));
  if (!categoryId || !Number.isFinite(amountInput) || amountInput <= 0) return;
  if (!BUDGET_CADENCES.includes(cadenceInput as (typeof BUDGET_CADENCES)[number])) return;
  if (!(await isCategoryOwnedByFamily(categoryId, user.familyId))) return;

  await setBudgetLineUseCase.execute({
    familyId: user.familyId,
    categoryId,
    cadence: cadenceInput as (typeof BUDGET_CADENCES)[number],
    budgetedAmountCents: Math.round(amountInput * 100),
  });
  revalidatePath("/budgets");
  revalidatePath("/");
}

async function deleteBudgetLine(formData: FormData) {
  "use server";
  const user = await requireUser();
  const categoryId = Number(formData.get("categoryId"));
  if (!categoryId) return;
  if (!(await isCategoryOwnedByFamily(categoryId, user.familyId))) return;

  await deleteBudgetLineUseCase.execute(user.familyId, categoryId);
  revalidatePath("/budgets");
  revalidatePath("/");
}

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ periods?: string }> }) {
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const { periods: periodsParam } = await searchParams;

  const allPeriods = await listPayPeriodsUseCase.execute(user.familyId, today);
  const currentIdx = findPeriodIndexContaining(allPeriods, today);
  const defaultPeriod = allPeriods[currentIdx] ?? allPeriods[0];

  const requestedIds = periodsParam
    ? periodsParam
        .split(",")
        .map(Number)
        .filter((id) => allPeriods.some((p) => p.id === id))
    : [];
  const selectedPeriods = requestedIds.length > 0 ? allPeriods.filter((p) => requestedIds.includes(p.id)) : [defaultPeriod];
  const selectedIds = selectedPeriods.map((p) => p.id);
  const displayPeriod = rangeFromPeriods(selectedPeriods);

  const [categoriesList, budgetSettings, recurringItems, actuals] = await Promise.all([
    getFamilyCategories(user.familyId),
    getBudgetCategorySettings(user.familyId),
    getFamilyRecurringItems(user.familyId),
    getCategoryTotalsForDateRange(user.familyId, displayPeriod.start, displayPeriod.end),
  ]);

  const effectiveBudgets = composeEffectiveBudgets(budgetSettings, recurringItems, selectedPeriods);
  const effectiveByCategory = new Map(effectiveBudgets.map((b) => [b.categoryId, b.targetCents]));
  const manualByCategory = new Map(budgetSettings.map((s) => [s.categoryId, s]));
  const actualByCategory = new Map(actuals.map((a) => [a.categoryId, a.totalCents]));

  const rows = categoriesList.map((c) => {
    const manual = manualByCategory.get(c.id);
    return {
      categoryId: c.id,
      name: c.name,
      color: c.color,
      cadence: manual?.cadence ?? ("monthly" as const),
      manualBudgetedAmountCents: manual?.budgetedAmountCents ?? 0,
      effectiveBudgetedCents: effectiveByCategory.get(c.id) ?? 0,
      actualCents: actualByCategory.get(c.id) ?? 0,
    };
  });

  const periodOptions = allPeriods.map((p, i) => ({ id: p.id, label: `Quincena ${i + 1} · ${periodLabel(p.start, p.end)}`, isCurrent: i === currentIdx }));

  return (
    <BudgetsPageTemplate
      rows={rows}
      periodLabel={periodLabel(displayPeriod.start, displayPeriod.end)}
      periods={periodOptions}
      selectedIds={selectedIds}
      setLineAction={setBudgetLine}
      deleteLineAction={deleteBudgetLine}
    />
  );
}
