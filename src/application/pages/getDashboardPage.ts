import type { AuthenticatedUser } from "@/domain/auth/ports";
import { composeBudgetOverview } from "@/domain/budget/overview";
import { categoryOptionsWithHierarchy } from "@/domain/categories/rules";
import { resolvePreset } from "@/domain/explorer/presets";
import { financialCalendarEntries, sortCalendarEntries } from "@/domain/calendar/rules";
import { accountIdsByGoal, goalProjectionInputs, goalSummaries } from "@/domain/goals/progress";
import { goalsForInsights, paidOccurrencesForInsights } from "@/domain/insights/inputs";
import type { AccountsReader, CategoriesReader, InboxReader, PlanningReader, TransactionsReader } from "@/domain/readModels/ports";
import type { GetCalendarOccurrencesUseCase } from "../getCalendarOccurrences";
import type { GetDashboardSummaryUseCase } from "../getDashboardSummary";
import type { GetDebtCalendarUseCase } from "../getDebtCalendar";
import type { GetDebtOverviewUseCase } from "../getDebtOverview";
import type { GetExplorerUseCase } from "../getExplorer";
import type { GetGoalProjectionsUseCase } from "../getGoalProjections";
import type { GetInsightsUseCase } from "../getInsights";
import type { ResolvePeriodContextUseCase } from "./resolvePeriodContext";

export interface DashboardPageDependencies {
  periods: ResolvePeriodContextUseCase;
  accounts: AccountsReader;
  categories: CategoriesReader;
  planning: PlanningReader;
  inbox: InboxReader;
  transactions: Pick<TransactionsReader, "between">;
  summary: GetDashboardSummaryUseCase;
  calendarOccurrences: GetCalendarOccurrencesUseCase;
  explorer: GetExplorerUseCase;
  debtOverview: GetDebtOverviewUseCase;
  debtCalendar: GetDebtCalendarUseCase;
  goalProjections: GetGoalProjectionsUseCase;
  insights: GetInsightsUseCase;
}

export class GetDashboardPageUseCase {
  constructor(private readonly deps: DashboardPageDependencies) {}

  async execute(user: AuthenticatedUser, today: string, periodsParam: string | undefined) {
    const { deps } = this;
    const familyId = user.familyId;
    const { selectedPeriods, displayPeriod, previousRange, header: periodHeader } = await deps.periods.execute(familyId, today, periodsParam);

    const [
      pendingCandidates,
      pendingConceptSuggestions,
      recurringItems,
      scheduled,
      categoryActuals,
      calendarTransactions,
      categories,
      goalsList,
      accounts,
      goalAccountLinks,
      budgetSettings,
      calendarOccurrences,
      debtAccounts,
      debtDueEntries,
    ] = await Promise.all([
      deps.inbox.pendingRecurringCandidates(familyId),
      deps.inbox.pendingConceptSuggestions(familyId),
      deps.planning.recurringItems(familyId),
      deps.planning.scheduled(familyId),
      deps.categories.expenseTotalsBetween(familyId, displayPeriod.start, displayPeriod.end),
      deps.transactions.between(familyId, displayPeriod.start, displayPeriod.end),
      deps.categories.list(familyId),
      deps.planning.goals(familyId),
      deps.accounts.listActive(familyId),
      deps.planning.goalAccountLinks(familyId),
      deps.planning.budgetSettings(familyId),
      deps.calendarOccurrences.execute(familyId, selectedPeriods),
      deps.debtOverview.execute(familyId, today),
      deps.debtCalendar.execute(familyId, today, displayPeriod.start, displayPeriod.end),
    ]);

    const budgetOverview = composeBudgetOverview({ categories, settings: budgetSettings, recurringItems, periods: selectedPeriods, actuals: categoryActuals });
    const unpaidDebtDues = debtDueEntries.filter((entry) => entry.status !== "paid").map((entry) => ({ name: entry.name, amountCents: entry.expectedAmountCents, date: entry.expectedDate }));

    const [summary, goalProjections] = await Promise.all([
      deps.summary.execute(familyId, displayPeriod, previousRange, today, budgetOverview.totalCents, calendarOccurrences, unpaidDebtDues),
      deps.goalProjections.execute(goalProjectionInputs(goalsList, accountIdsByGoal(goalAccountLinks)), today),
    ]);

    const currentPeriod = { from: displayPeriod.start, to: displayPeriod.end };
    const initialRange = resolvePreset("period", today, currentPeriod, null);
    const [explorerResult, insights] = await Promise.all([
      deps.explorer.execute(familyId, { ...initialRange, accountId: null, categoryId: null, merchant: null, nature: null }, today),
      deps.insights.execute(familyId, today, {
        savings: { rate: summary.savingsRate.rate, previousRate: summary.savingsRate.previousRate, savedCents: summary.savingsRate.savedCents },
        netWorthDeltaCents: summary.wealth.change.deltaCents,
        occurrences: paidOccurrencesForInsights(calendarOccurrences),
        goals: goalsForInsights(goalsList, new Map(goalProjections.map((projection) => [projection.goalId, projection.projection]))),
      }),
    ]);

    return {
      header: { userName: user.name, ...periodHeader },
      summary,
      debtAccounts,
      goals: goalSummaries(goalsList, goalProjections),
      insights,
      calendarEntries: sortCalendarEntries([...financialCalendarEntries(calendarOccurrences, scheduled, calendarTransactions, today, displayPeriod.start, displayPeriod.end), ...debtDueEntries]),
      pendingCandidates,
      pendingConceptSuggestions,
      explorer: {
        today,
        currentPeriod,
        initialResult: explorerResult,
        accounts: accounts.map(({ id, name }) => ({ id, name })),
        categories: categoryOptionsWithHierarchy(categories).map(({ id, name, label }) => ({ id, name, label })),
      },
    };
  }
}
