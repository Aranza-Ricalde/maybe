import type { FormAction } from "@/lib/actionResult";
import type { DashboardPageView } from "@/application/pages/getDashboardPage";
import { MetricStrip } from "@/components/molecules/MetricStrip";
import { ResponsiveTabs } from "@/components/molecules/ResponsiveTabs";
import { AttentionSection, type AttentionSectionProps } from "@/components/organisms/AttentionSection";
import { AvailableToSpendCard } from "@/components/organisms/AvailableToSpendCard";
import { DashboardHero } from "@/components/organisms/DashboardHero";
import { DashboardQuickActions } from "@/components/organisms/DashboardQuickActions";
import { FinancialCalendarCard, type FinancialCalendarCardProps } from "@/components/organisms/FinancialCalendarCard";
import { HealthScoreCard } from "@/components/organisms/HealthScoreCard";
import { MoneyMovementCard } from "@/components/organisms/MoneyMovementCard";
import { RecentMovementsCard } from "@/components/organisms/RecentMovementsCard";
import { SpendingLimitCard } from "@/components/organisms/SpendingLimitCard";
import { SpendingPaceSection } from "@/components/organisms/SpendingPaceSection";
import { buildDecisions } from "@/lib/presenters/attention";
import { buildDashboardMetrics } from "@/lib/presenters/dashboard";

export interface DashboardPageTemplateProps {
  data: DashboardPageView;
  today: string;
  calendar: Pick<FinancialCalendarCardProps, "decisionAction" | "listPaymentCandidates" | "linkPaymentAction">;
  attentionActions: AttentionSectionProps["actions"];
  recordTransferAction: FormAction;
}

export function DashboardPageTemplate({ data, today, calendar, attentionActions, recordTransferAction }: DashboardPageTemplateProps) {
  const { header, summary, pace, health, movement, periodRange, recentMovements, accounts, period, insights, calendarEntries, pendingCandidates, pendingConceptSuggestions } = data;

  return (
    <>
      <div className="max-md:order-1">
        <DashboardHero userName={header.userName} periodLabel={header.periodLabel} periods={header.periods} selectedIds={header.selectedIds} />
      </div>

      <div className="max-md:order-2 md:hidden">
        <DashboardQuickActions accounts={accounts} today={today} recordTransferAction={recordTransferAction} entries={calendarEntries} calendar={calendar} />
      </div>

      <div className="max-md:order-3">
        <AvailableToSpendCard availableCents={summary.availableToSpend.availableCents} upcomingCommitmentsCents={summary.availableToSpend.upcomingCommitmentsCents} runway={summary.runway} detail={summary.availableToSpendDetail} />
      </div>

      <ResponsiveTabs
        className="max-md:order-5"
        ariaLabel="Detalle del periodo"
        panelsClassName="md:flex md:flex-col md:gap-4 lg:grid lg:grid-cols-3 [&>section>*]:md:h-full"
        tabs={[
          { id: "health", label: "Salud", className: "md:order-3", content: <HealthScoreCard health={health} /> },
          { id: "limit", label: "Límite", className: "md:order-1", content: <SpendingLimitCard pace={pace} range={periodRange} /> },
          { id: "movement", label: "Movimiento", className: "md:order-2", content: <MoneyMovementCard days={movement} /> },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 max-md:order-6 lg:grid-cols-3">
        <div className="min-w-0 max-md:hidden lg:col-span-2">{pace && <SpendingPaceSection pace={pace} />}</div>
        <MetricStrip stacked metrics={buildDashboardMetrics(pace, period, summary.savingsRate)} />
      </div>

      <div className="max-md:hidden">
        <RecentMovementsCard movements={recentMovements} />
      </div>

      <div className="contents lg:grid lg:grid-cols-2 lg:gap-4">
        <div className="min-w-0 max-md:order-7">
          <FinancialCalendarCard entries={calendarEntries} {...calendar} />
        </div>
        <div className="min-w-0 max-md:order-4">
          <AttentionSection decisions={buildDecisions(pendingCandidates, pendingConceptSuggestions)} insights={insights} actions={attentionActions} />
        </div>
      </div>
    </>
  );
}
