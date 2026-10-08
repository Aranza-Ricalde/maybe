import { getDashboardPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { AttentionSection } from "@/components/organisms/AttentionSection";
import { buildDecisions } from "@/lib/presenters/attention";
import { AvailableToSpendCard } from "@/components/organisms/AvailableToSpendCard";
import { HealthScoreCard } from "@/components/organisms/HealthScoreCard";
import { MoneyMovementCard } from "@/components/organisms/MoneyMovementCard";
import { SpendingLimitCard } from "@/components/organisms/SpendingLimitCard";
import { RecentMovementsCard } from "@/components/organisms/RecentMovementsCard";
import { DashboardHero } from "@/components/organisms/DashboardHero";
import { MetricStrip } from "@/components/molecules/MetricStrip";
import { SpendingPaceSection } from "@/components/organisms/SpendingPaceSection";
import { buildDashboardMetrics } from "@/lib/presenters/dashboard";
import { FinancialCalendarCard } from "@/components/organisms/FinancialCalendarCard";
import {
  confirmConceptSuggestionAction,
  linkPaymentAction,
  listPaymentCandidatesAction,
  rejectConceptSuggestionAction,
  resolveOccurrenceAction,
} from "./actions";
import type { PeriodsSearchParams } from "@/domain/shared/routes";
import { todayIso } from "@/lib/today";
import { acceptCandidate, dismissCandidate } from "./recurring/actions";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<PeriodsSearchParams> }) {
  const user = await requireUser();
  const { periods } = await searchParams;
  const { header, summary, pace, health, movement, periodRange, recentMovements, period, insights, calendarEntries, pendingCandidates, pendingConceptSuggestions } = await getDashboardPageUseCase.execute(user, todayIso(), periods);

  return (
    <>
      <DashboardHero userName={header.userName} periodLabel={header.periodLabel} periods={header.periods} selectedIds={header.selectedIds} />

      <AvailableToSpendCard availableCents={summary.availableToSpend.availableCents} upcomingCommitmentsCents={summary.availableToSpend.upcomingCommitmentsCents} runway={summary.runway} detail={summary.availableToSpendDetail} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">{pace && <SpendingPaceSection pace={pace} />}</div>
        <MetricStrip stacked metrics={buildDashboardMetrics(pace, period, summary.savingsRate)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SpendingLimitCard pace={pace} range={periodRange} />
        <MoneyMovementCard days={movement} />
        <HealthScoreCard health={health} />
      </div>

      <RecentMovementsCard movements={recentMovements} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FinancialCalendarCard entries={calendarEntries} decisionAction={resolveOccurrenceAction} listPaymentCandidates={listPaymentCandidatesAction} linkPaymentAction={linkPaymentAction} />
        <AttentionSection
          decisions={buildDecisions(pendingCandidates, pendingConceptSuggestions)}
          insights={insights}
          actions={{ recurring: { confirm: acceptCandidate, dismiss: dismissCandidate }, concept: { confirm: confirmConceptSuggestionAction, dismiss: rejectConceptSuggestionAction } }}
        />
      </div>

    </>
  );
}
