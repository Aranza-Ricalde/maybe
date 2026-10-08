import { getDashboardPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { AvailableToSpendCard } from "@/components/organisms/AvailableToSpendCard";
import { ConceptSuggestionsCard } from "@/components/organisms/ConceptSuggestionsCard";
import { DashboardHeader } from "@/components/organisms/DashboardHeader";
import { DashboardKpiRow } from "@/components/organisms/DashboardKpiRow";
import { ExplorerCard } from "@/components/organisms/ExplorerCard";
import { FinancialCalendarCard } from "@/components/organisms/FinancialCalendarCard";
import { InsightsCard } from "@/components/organisms/InsightsCard";
import { RecurringCandidatesCard } from "@/components/organisms/RecurringCandidatesCard";
import { TabbedSections } from "@/components/organisms/TabbedSections";
import {
  confirmConceptSuggestionAction,
  linkPaymentAction,
  listPaymentCandidatesAction,
  loadExplorerAction,
  rejectConceptSuggestionAction,
  resolveOccurrenceAction,
} from "./actions";
import { todayIso } from "@/lib/today";
import { acceptCandidate, dismissCandidate } from "./recurring/actions";
import type { PeriodsSearchParams } from "@/domain/shared/routes";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<PeriodsSearchParams> }) {
  const user = await requireUser();
  const { periods } = await searchParams;
  const { header, summary, debtAccounts, goals, insights, calendarEntries, explorer, pendingCandidates, pendingConceptSuggestions } = await getDashboardPageUseCase.execute(user, todayIso(), periods);

  return (
    <>
      <DashboardHeader {...header} />

      <AvailableToSpendCard
        availableCents={summary.availableToSpend.availableCents}
        upcomingCommitmentsCents={summary.availableToSpend.upcomingCommitmentsCents}
        runway={summary.runway}
        detail={summary.availableToSpendDetail}
        status={summary.financialStatus}
      />

      <DashboardKpiRow
        totalBalanceCents={summary.totalBalanceCents}
        debtTotalCents={summary.debt.totalCents}
        debtPaidThisPeriodCents={summary.debt.paidThisPeriodCents}
        debtOverallPercentPaid={summary.debt.overallPercentPaid}
        debtAccounts={debtAccounts}
        savingsTotalCents={summary.savingsTotalCents}
        goals={goals}
        wealth={summary.wealth}
        savingsRate={summary.savingsRate}
      />

      <ExplorerCard
        title="Explora tu dinero"
        description="Combina filtros para ver en qué se va y cómo cambia."
        initialView="flow"
        initialPreset="period"
        initialResult={explorer.initialResult}
        today={explorer.today}
        currentPeriod={explorer.currentPeriod}
        accounts={explorer.accounts}
        categories={explorer.categories}
        loadAction={loadExplorerAction}
      />

      <TabbedSections
        title="Por revisar"
        tabs={[
          { id: "insights", label: "Qué cambió", count: insights.length, content: <InsightsCard insights={insights} /> },
          { id: "recurring", label: "Recurrentes sugeridos", count: pendingCandidates.length, content: <RecurringCandidatesCard candidates={pendingCandidates} acceptAction={acceptCandidate} dismissAction={dismissCandidate} /> },
          { id: "concepts", label: "Coincidencias", count: pendingConceptSuggestions.length, content: <ConceptSuggestionsCard suggestions={pendingConceptSuggestions} confirmAction={confirmConceptSuggestionAction} rejectAction={rejectConceptSuggestionAction} /> },
        ]}
      />

      <FinancialCalendarCard entries={calendarEntries} decisionAction={resolveOccurrenceAction} listPaymentCandidates={listPaymentCandidatesAction} linkPaymentAction={linkPaymentAction} />
    </>
  );
}
