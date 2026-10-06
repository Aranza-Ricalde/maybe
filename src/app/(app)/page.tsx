import { getDashboardPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { AvailableToSpendCard } from "@/components/organisms/AvailableToSpendCard";
import { BalanceSummaryRow } from "@/components/organisms/BalanceSummaryRow";
import { BudgetByCategoryCard } from "@/components/organisms/BudgetByCategoryCard";
import { ConceptSuggestionsCard } from "@/components/organisms/ConceptSuggestionsCard";
import { DashboardHeader } from "@/components/organisms/DashboardHeader";
import { FinancialCalendarCard } from "@/components/organisms/FinancialCalendarCard";
import { FinancialEvolutionCard } from "@/components/organisms/FinancialEvolutionCard";
import { InsightsCard } from "@/components/organisms/InsightsCard";
import { PeriodFlowCard } from "@/components/organisms/PeriodFlowCard";
import { RecentActivityCard } from "@/components/organisms/RecentActivityCard";
import { RecurringCandidatesCard } from "@/components/organisms/RecurringCandidatesCard";
import { WealthSummaryRow } from "@/components/organisms/WealthSummaryRow";
import { WeeklyFlowCard } from "@/components/organisms/WeeklyFlowCard";
import {
  confirmConceptSuggestionAction,
  linkPaymentAction,
  listPaymentCandidatesAction,
  loadEvolutionSeriesAction,
  rejectConceptSuggestionAction,
  resolveOccurrenceAction,
} from "./actions";
import { todayIso } from "@/lib/today";
import { acceptCandidate, dismissCandidate } from "./recurring/actions";
import type { PeriodsSearchParams } from "@/domain/shared/routes";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<PeriodsSearchParams> }) {
  const user = await requireUser();
  const { periods } = await searchParams;
  const { header, summary, emergencyFund, debtAccounts, goals, insights, categoryActuals, categories, weeklyFlow, calendarEntries, categoryBudgets, ...rest } = await getDashboardPageUseCase.execute(user, todayIso(), periods);

  return (
    <>
      <DashboardHeader {...header} />

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

      <WealthSummaryRow wealth={summary.wealth} savingsRate={summary.savingsRate} emergencyFund={emergencyFund} />
      <InsightsCard insights={insights} />
      <PeriodFlowCard status={summary.financialStatus} flow={summary.flow} balanceSeries={summary.balanceSeries} categoryActuals={categoryActuals} categories={categories} />
      <WeeklyFlowCard weeks={weeklyFlow} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinancialCalendarCard entries={calendarEntries} decisionAction={resolveOccurrenceAction} listPaymentCandidates={listPaymentCandidatesAction} linkPaymentAction={linkPaymentAction} />
        <BudgetByCategoryCard categories={categoryBudgets} />
      </div>

      <FinancialEvolutionCard initialSeries={rest.initialEvolutionSeries} loadSeries={loadEvolutionSeriesAction} />
      <RecurringCandidatesCard candidates={rest.pendingCandidates} acceptAction={acceptCandidate} dismissAction={dismissCandidate} />
      <ConceptSuggestionsCard suggestions={rest.pendingConceptSuggestions} confirmAction={confirmConceptSuggestionAction} rejectAction={rejectConceptSuggestionAction} />
      <RecentActivityCard transactions={rest.recentTransactions} />
    </>
  );
}
