import type { AuthenticatedUser } from "@/domain/auth/ports";
import { composeBudgetOverview, topLevelBudgetCards } from "@/domain/budget/overview";
import { financialCalendarEntries, sortCalendarEntries } from "@/domain/calendar/rules";
import { accountIdsByGoal, goalProjectionInputs, goalSummaries } from "@/domain/goals/progress";
import { goalsForInsights, paidOccurrencesForInsights } from "@/domain/insights/inputs";
import type { CategoriesReader, InboxReader, PlanningReader, TransactionsReader } from "@/domain/readModels/ports";
import type { GetCalendarOccurrencesUseCase } from "../getCalendarOccurrences";
import type { GetDashboardSummaryUseCase } from "../getDashboardSummary";
import type { GetDebtCalendarUseCase } from "../getDebtCalendar";
import type { GetDebtOverviewUseCase } from "../getDebtOverview";
import type { GetEmergencyFundUseCase } from "../getEmergencyFund";
import type { GetFinancialEvolutionUseCase } from "../getFinancialEvolution";
import type { GetGoalProjectionsUseCase } from "../getGoalProjections";
import type { GetInsightsUseCase } from "../getInsights";
import type { GetWeeklyFlowUseCase } from "../getWeeklyFlow";
import type { ResolvePeriodContextUseCase } from "./resolvePeriodContext";

const RECENT_TRANSACTIONS_LIMIT = 8;

export interface DashboardPageDependencies {
  periods: ResolvePeriodContextUseCase;
  categories: CategoriesReader;
  planning: PlanningReader;
  inbox: InboxReader;
  transactions: TransactionsReader;
  summary: GetDashboardSummaryUseCase;
  calendarOccurrences: GetCalendarOccurrencesUseCase;
  evolution: GetFinancialEvolutionUseCase;
  emergencyFund: GetEmergencyFundUseCase;
  debtOverview: GetDebtOverviewUseCase;
  debtCalendar: GetDebtCalendarUseCase;
  weeklyFlow: GetWeeklyFlowUseCase;
  goalProjections: GetGoalProjectionsUseCase;
  insights: GetInsightsUseCase;
}

export class GetDashboardPageUseCase {
  constructor(private readonly deps: DashboardPageDependencies) {}

  async execute(user: AuthenticatedUser, today: string, periodsParam: string | undefined) {
    const { deps } = this;
    const familyId = user.familyId;
    const { selectedPeriods, displayPeriod, previousPeriod, header: periodHeader } = await deps.periods.execute(familyId, today, periodsParam);

    const [
      pendingCandidates,
      pendingConceptSuggestions,
      recentTransactions,
      recurringItems,
      scheduled,
      categoryActuals,
      calendarTransactions,
      categories,
      goalsList,
      goalAccountLinks,
      budgetSettings,
      calendarOccurrences,
      initialEvolutionSeries,
      emergencyFund,
      debtAccounts,
      weeklyFlow,
      debtDueEntries,
    ] = await Promise.all([
      deps.inbox.pendingRecurringCandidates(familyId),
      deps.inbox.pendingConceptSuggestions(familyId),
      deps.transactions.recent(familyId, RECENT_TRANSACTIONS_LIMIT),
      deps.planning.recurringItems(familyId),
      deps.planning.scheduled(familyId),
      deps.categories.expenseTotalsBetween(familyId, displayPeriod.start, displayPeriod.end),
      deps.transactions.between(familyId, displayPeriod.start, displayPeriod.end),
      deps.categories.list(familyId),
      deps.planning.goals(familyId),
      deps.planning.goalAccountLinks(familyId),
      deps.planning.budgetSettings(familyId),
      deps.calendarOccurrences.execute(familyId, selectedPeriods),
      deps.evolution.execute(familyId, "balance", "30d", today),
      deps.emergencyFund.execute(familyId, today),
      deps.debtOverview.execute(familyId, today),
      deps.weeklyFlow.execute(familyId, displayPeriod.start, displayPeriod.end, today),
      deps.debtCalendar.execute(familyId, today, displayPeriod.start, displayPeriod.end),
    ]);

    const budgetOverview = composeBudgetOverview({ categories, settings: budgetSettings, recurringItems, periods: selectedPeriods, actuals: categoryActuals });
    const unpaidDebtDues = debtDueEntries.filter((entry) => entry.status !== "paid").map((entry) => ({ name: entry.name, amountCents: entry.expectedAmountCents, date: entry.expectedDate }));

    const [summary, goalProjections] = await Promise.all([
      deps.summary.execute(familyId, displayPeriod, previousPeriod, today, budgetOverview.totalCents, calendarOccurrences, unpaidDebtDues),
      deps.goalProjections.execute(goalProjectionInputs(goalsList, accountIdsByGoal(goalAccountLinks)), today),
    ]);

    const insights = await deps.insights.execute(familyId, today, {
      savings: { rate: summary.savingsRate.rate, previousRate: summary.savingsRate.previousRate, savedCents: summary.savingsRate.savedCents },
      netWorthDeltaCents: summary.wealth.change.deltaCents,
      occurrences: paidOccurrencesForInsights(calendarOccurrences),
      goals: goalsForInsights(goalsList, new Map(goalProjections.map((projection) => [projection.goalId, projection.projection]))),
    });

    return {
      header: { userName: user.name, ...periodHeader },
      summary,
      emergencyFund,
      debtAccounts,
      goals: goalSummaries(goalsList, goalProjections),
      insights,
      categoryActuals,
      categories: categories.map(({ id, name, parentId }) => ({ id, name, parentId })),
      weeklyFlow,
      calendarEntries: sortCalendarEntries([...financialCalendarEntries(calendarOccurrences, scheduled, calendarTransactions, today, displayPeriod.start, displayPeriod.end), ...debtDueEntries]),
      categoryBudgets: topLevelBudgetCards(budgetOverview.hierarchy, categories),
      initialEvolutionSeries,
      pendingCandidates,
      pendingConceptSuggestions,
      recentTransactions,
    };
  }
}
