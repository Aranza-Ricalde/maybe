import { revalidatePath } from "next/cache";
import { isConceptSuggestionOwnedByFamily } from "@/app/lib/authorization";
import { requireUser } from "@/app/lib/dal";
import {
  getAccountBalancesAsOf,
  getBudgetCategorySettings,
  getCategoryTotalsForDateRange,
  getFamilyCategories,
  getFamilyGoals,
  getFamilyLiabilityAccountsWithBalances,
  getFamilyRecurringItems,
  getFamilyScheduled,
  getGoalAccountLinks,
  getPendingConceptSuggestions,
  getPendingRecurringCandidates,
  getPeriodTransactionsForCalendar,
  getRecentTransactions,
} from "@/app/lib/queries";
import { AvailableToSpendCard } from "@/components/organisms/AvailableToSpendCard";
import { BalanceSummaryRow } from "@/components/organisms/BalanceSummaryRow";
import { BudgetByCategoryCard } from "@/components/organisms/BudgetByCategoryCard";
import { ConceptSuggestionsCard } from "@/components/organisms/ConceptSuggestionsCard";
import { DashboardHeader } from "@/components/organisms/DashboardHeader";
import { FinancialCalendarCard } from "@/components/organisms/FinancialCalendarCard";
import { FinancialEvolutionCard, type EvolutionDataset } from "@/components/organisms/FinancialEvolutionCard";
import { PeriodFlowCard } from "@/components/organisms/PeriodFlowCard";
import { RecentActivityCard } from "@/components/organisms/RecentActivityCard";
import { RecurringCandidatesCard } from "@/components/organisms/RecurringCandidatesCard";
import { composeEffectiveBudgets } from "@/domain/budget/rules";
import { financialCalendarEntries } from "@/domain/calendar/rules";
import { EVOLUTION_METRICS, EVOLUTION_RANGES, type EvolutionRangeKey } from "@/domain/evolution/rules";
import { findPeriodIndexContaining, periodLabel, rangeFromPeriods } from "@/domain/payPeriod/rules";
import {
  confirmConceptSuggestionUseCase,
  getDashboardSummaryUseCase,
  getFinancialEvolutionUseCase,
  listPayPeriodsUseCase,
  rejectConceptSuggestionUseCase,
} from "@/infrastructure/container";

async function confirmConceptSuggestionAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isConceptSuggestionOwnedByFamily(id, user.familyId))) return;

  await confirmConceptSuggestionUseCase.execute(id);
  revalidatePath("/");
  revalidatePath("/transactions");
}

async function rejectConceptSuggestionAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isConceptSuggestionOwnedByFamily(id, user.familyId))) return;

  await rejectConceptSuggestionUseCase.execute(id);
  revalidatePath("/");
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periods?: string }> }) {
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
  const minSelectedIdx = Math.min(...selectedPeriods.map((p) => allPeriods.findIndex((ap) => ap.id === p.id)));
  const previousPeriod = allPeriods[minSelectedIdx - 1] ?? selectedPeriods[0];

  const evolutionCombos = EVOLUTION_METRICS.flatMap((metric) => EVOLUTION_RANGES.map((range) => ({ metric, range })));

  const [
    [pendingCandidates, pendingConceptSuggestions, recentTransactions, recurringItems, scheduled, categoryActuals, calendarTransactions, categoriesList, goalsList, debtAccounts, goalAccountLinks, budgetSettings],
    evolutionSeriesList,
  ] = await Promise.all([
    Promise.all([
      getPendingRecurringCandidates(user.familyId),
      getPendingConceptSuggestions(user.familyId),
      getRecentTransactions(user.familyId, 8),
      getFamilyRecurringItems(user.familyId),
      getFamilyScheduled(user.familyId),
      getCategoryTotalsForDateRange(user.familyId, displayPeriod.start, displayPeriod.end),
      getPeriodTransactionsForCalendar(user.familyId, displayPeriod.start, displayPeriod.end),
      getFamilyCategories(user.familyId),
      getFamilyGoals(user.familyId),
      getFamilyLiabilityAccountsWithBalances(user.familyId, today),
      getGoalAccountLinks(user.familyId),
      getBudgetCategorySettings(user.familyId),
    ]),
    Promise.all(evolutionCombos.map(({ metric, range }) => getFinancialEvolutionUseCase.execute(user.familyId, metric, range, today))),
  ]);

  const effectiveBudgets = composeEffectiveBudgets(budgetSettings, recurringItems, selectedPeriods);
  const budgetedTotalCents = effectiveBudgets.length > 0 ? effectiveBudgets.reduce((sum, b) => sum + b.targetCents, 0) : null;

  const summary = await getDashboardSummaryUseCase.execute(
    user.familyId,
    { start: displayPeriod.start, end: displayPeriod.end },
    { start: previousPeriod.start, end: previousPeriod.end },
    today,
    budgetedTotalCents,
  );

  const calendarEntries = financialCalendarEntries(recurringItems, scheduled, calendarTransactions, today, displayPeriod.start, displayPeriod.end);
  const categoryNameById = new Map(categoriesList.map((c) => [c.id, c.name]));
  const categoryColorById = new Map(categoriesList.map((c) => [c.id, c.color]));

  const budgetActualByCategory = new Map(categoryActuals.map((a) => [a.categoryId, a.totalCents]));
  const categoryBudgets = effectiveBudgets.map((b) => ({
    categoryId: b.categoryId,
    name: categoryNameById.get(b.categoryId) ?? "Otro",
    color: categoryColorById.get(b.categoryId) ?? "#999999",
    budgetedCents: b.targetCents,
    actualCents: budgetActualByCategory.get(b.categoryId) ?? 0,
  }));

  const evolutionData = evolutionCombos.reduce((acc, { metric, range }, i) => {
    acc[metric] ??= {} as Record<EvolutionRangeKey, (typeof evolutionSeriesList)[number]>;
    acc[metric][range] = evolutionSeriesList[i];
    return acc;
  }, {} as EvolutionDataset);

  const accountIdsByGoal = new Map<number, number[]>();
  for (const link of goalAccountLinks) {
    const list = accountIdsByGoal.get(link.goalId) ?? [];
    list.push(link.accountId);
    accountIdsByGoal.set(link.goalId, list);
  }
  const allGoalAccountIds = [...new Set(goalAccountLinks.map((l) => l.accountId))];
  const goalAccountBalances = await getAccountBalancesAsOf(allGoalAccountIds, today);
  const goals = goalsList.map((g) => {
    const linkedAccountIds = accountIdsByGoal.get(g.id) ?? [];
    const currentCents = linkedAccountIds.reduce((sum, accountId) => sum + (goalAccountBalances.get(accountId) ?? 0), 0);
    return { id: g.id, name: g.name, targetAmountCents: g.targetAmountCents, currentCents };
  });

  const periodOptions = allPeriods.map((p, i) => ({ id: p.id, label: `Quincena ${i + 1} · ${periodLabel(p.start, p.end)}`, isCurrent: i === currentIdx }));

  return (
    <>
      <DashboardHeader
        userName={user.name}
        periodLabel={periodLabel(displayPeriod.start, displayPeriod.end)}
        periods={periodOptions}
        selectedIds={selectedIds}
      />

      <AvailableToSpendCard
        availableCents={summary.availableToSpend.availableCents}
        upcomingCommitmentsCents={summary.availableToSpend.upcomingCommitmentsCents}
        runway={summary.runway}
        detail={summary.availableToSpendDetail}
      />

      <BalanceSummaryRow
        totalBalanceCents={summary.totalBalanceCents}
        debtTotalCents={summary.debt.totalCents}
        debtPaidThisPeriodCents={summary.debt.paidThisPeriodCents}
        debtOverallPercentPaid={summary.debt.overallPercentPaid}
        debtAccounts={debtAccounts}
        savingsTotalCents={summary.savingsTotalCents}
        goals={goals}
      />

      <PeriodFlowCard
        status={summary.financialStatus}
        flow={summary.flow}
        balanceSeries={summary.balanceSeries}
        categoryActuals={categoryActuals}
        categoryNameById={categoryNameById}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinancialCalendarCard entries={calendarEntries} />
        <BudgetByCategoryCard categories={categoryBudgets} />
      </div>

      <FinancialEvolutionCard data={evolutionData} />

      <RecurringCandidatesCard candidates={pendingCandidates} />

      <ConceptSuggestionsCard
        suggestions={pendingConceptSuggestions}
        confirmAction={confirmConceptSuggestionAction}
        rejectAction={rejectConceptSuggestionAction}
      />

      <RecentActivityCard transactions={recentTransactions} />
    </>
  );
}
