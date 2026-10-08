import type { AuthenticatedUser } from "@/domain/auth/ports";
import { composeBudgetOverview } from "@/domain/budget/overview";
import { computeHealthScore } from "@/domain/dashboard/health";
import { lastDaysFlow } from "@/domain/dashboard/movement";
import { buildSpendingPace } from "@/domain/dashboard/pace";
import { resolvePreset } from "@/domain/explorer/presets";
import { financialCalendarEntries, sortCalendarEntries } from "@/domain/calendar/rules";
import { accountIdsByGoal, goalProjectionInputs } from "@/domain/goals/progress";
import { goalsForInsights, paidOccurrencesForInsights } from "@/domain/insights/inputs";
import type { CategoriesReader, InboxReader, PlanningReader, TransactionsReader } from "@/domain/readModels/ports";
import type { GetEmergencyFundUseCase } from "../getEmergencyFund";
import type { GetCalendarOccurrencesUseCase } from "../getCalendarOccurrences";
import type { GetDashboardSummaryUseCase } from "../getDashboardSummary";
import type { GetDebtCalendarUseCase } from "../getDebtCalendar";
import type { GetExplorerUseCase } from "../getExplorer";
import type { GetGoalProjectionsUseCase } from "../getGoalProjections";
import type { GetInsightsUseCase } from "../getInsights";
import type { ResolvePeriodContextUseCase } from "./resolvePeriodContext";

export interface DashboardPageDependencies {
  periods: ResolvePeriodContextUseCase;
  categories: CategoriesReader;
  planning: PlanningReader;
  inbox: InboxReader;
  transactions: Pick<TransactionsReader, "between" | "recent">;
  summary: GetDashboardSummaryUseCase;
  calendarOccurrences: GetCalendarOccurrencesUseCase;
  explorer: GetExplorerUseCase;
  debtCalendar: GetDebtCalendarUseCase;
  goalProjections: GetGoalProjectionsUseCase;
  insights: GetInsightsUseCase;
  emergencyFund: GetEmergencyFundUseCase;
}

const RECENT_MOVEMENTS = 6;

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
      goalAccountLinks,
      budgetSettings,
      calendarOccurrences,
      debtDueEntries,
      recentMovements,
    ] = await Promise.all([
      deps.inbox.pendingRecurringCandidates(familyId),
      deps.inbox.pendingConceptSuggestions(familyId),
      deps.planning.recurringItems(familyId),
      deps.planning.scheduled(familyId),
      deps.categories.expenseTotalsBetween(familyId, displayPeriod.start, displayPeriod.end),
      deps.transactions.between(familyId, displayPeriod.start, displayPeriod.end),
      deps.categories.list(familyId),
      deps.planning.goals(familyId),
      deps.planning.goalAccountLinks(familyId),
      deps.planning.budgetSettings(familyId),
      deps.calendarOccurrences.execute(familyId, selectedPeriods),
      deps.debtCalendar.execute(familyId, today, displayPeriod.start, displayPeriod.end),
      deps.transactions.recent(familyId, RECENT_MOVEMENTS),
    ]);

    const budgetOverview = composeBudgetOverview({ categories, settings: budgetSettings, recurringItems, periods: selectedPeriods, actuals: categoryActuals });
    const unpaidDebtDues = debtDueEntries.filter((entry) => entry.status !== "paid").map((entry) => ({ name: entry.name, amountCents: entry.expectedAmountCents, date: entry.expectedDate }));

    const [summary, goalProjections] = await Promise.all([
      deps.summary.execute(familyId, displayPeriod, previousRange, today, budgetOverview.totalCents, calendarOccurrences, unpaidDebtDues),
      deps.goalProjections.execute(goalProjectionInputs(goalsList, accountIdsByGoal(goalAccountLinks)), today),
    ]);

    const currentPeriod = { from: displayPeriod.start, to: displayPeriod.end };
    const initialRange = resolvePreset("period", today, currentPeriod, null);
    const [explorerResult, insights, emergencyFund] = await Promise.all([
      deps.explorer.execute(familyId, { ...initialRange, accountId: null, categoryId: null, merchant: null, nature: null }, today),
      deps.insights.execute(familyId, today, {
        savings: { rate: summary.savingsRate.rate, previousRate: summary.savingsRate.previousRate, savedCents: summary.savingsRate.savedCents, periodComplete: summary.period.daysElapsed >= summary.period.daysInPeriod },
        netWorthDeltaCents: summary.wealth.change.deltaCents,
        occurrences: paidOccurrencesForInsights(calendarOccurrences),
        goals: goalsForInsights(goalsList, new Map(goalProjections.map((projection) => [projection.goalId, projection.projection]))),
      }),
      deps.emergencyFund.execute(familyId, today),
    ]);

    const pace = explorerResult.bucket === "day"
      ? buildSpendingPace({ from: displayPeriod.start, to: displayPeriod.end, today, budgetCents: budgetOverview.totalCents ?? 0, dailyExpenseCents: explorerResult.series.map((point) => ({ date: point.key, expenseCents: point.expenseCents })) })
      : null;

    const entries = [...financialCalendarEntries(calendarOccurrences, scheduled, calendarTransactions, today, displayPeriod.start, displayPeriod.end), ...debtDueEntries];
    const dueEntries = entries.filter((entry) => entry.expectedDate <= today && entry.status !== "skipped");
    const paidDue = dueEntries.filter((entry) => entry.status === "paid").length;
    const assetsCents = summary.totalBalanceCents;
    const health = computeHealthScore({
      savingsRate: summary.savingsRate.rate,
      budgetUsage: pace && pace.budgetCents > 0 ? pace.spentCents / pace.budgetCents : null,
      debtToAssets: assetsCents > 0 ? Math.abs(summary.debt.totalCents) / assetsCents : null,
      emergencyMonths: emergencyFund.coverageMonths,
      emergencyTargetMonths: emergencyFund.targetMonths,
      billsPaidRatio: dueEntries.length > 0 ? paidDue / dueEntries.length : null,
    });
    const movement = lastDaysFlow(explorerResult.series, today, 7);

    return {
      header: { userName: user.name, ...periodHeader },
      summary,
      pace,
      health,
      movement,
      periodRange: { from: displayPeriod.start, to: displayPeriod.end },
      recentMovements,
      period: { incomeCents: explorerResult.incomeCents, expenseCents: explorerResult.expenseCents },
      insights,
      calendarEntries: sortCalendarEntries([...financialCalendarEntries(calendarOccurrences, scheduled, calendarTransactions, today, displayPeriod.start, displayPeriod.end), ...debtDueEntries]),
      pendingCandidates,
      pendingConceptSuggestions,
    };
  }
}
