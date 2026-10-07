import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import { ProgressListRow } from "@/components/molecules/ProgressListRow";
import type { SpendingAnalysisView } from "@/application/getSpendingAnalysis";
import { SMALL_EXPENSE_MAX_CENTS } from "@/domain/spendingAnalysis/rules";
import { formatMonthYear, formatPercent, formatPesos } from "@/lib/format";
import { SubscriptionsCard } from "./SubscriptionsCard";
import { TabbedSections } from "./TabbedSections";

export interface SpendingAnalysisSectionProps {
  analysis: SpendingAnalysisView;
  mergeAction: (formData: FormData) => void;
  dissolveAction: (formData: FormData) => void;
}

export function SpendingAnalysisSection({ analysis, mergeAction, dissolveAction }: SpendingAnalysisSectionProps) {
  const { small, merchants, subscriptions, monthsAnalyzed } = analysis;

  const merchantsCard = (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Comercios que más consumen</Card.Title>
        <Card.Description>Solo comercios identificados, últimos {monthsAnalyzed} meses completos, de mayor a menor.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {merchants.ranked.map((m) => (
          <ProgressListRow key={m.merchant} label={`${m.merchant} · ${m.count}`} value={formatPesos(m.totalCents)} percent={merchants.ranked[0].totalCents > 0 ? m.totalCents / merchants.ranked[0].totalCents : 0} />
        ))}
        {merchants.unidentified && (
          <Text size="xs" tone="muted" className="border-t border-separator pt-3">
            Sin comercio identificado: {formatPesos(merchants.unidentified.totalCents)} en {merchants.unidentified.count} movimientos ({formatPercent(merchants.unidentified.shareOfSpend)} de tu gasto). Incluye pagos a personas y descripciones libres.
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const smallCard = small && (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Tus gastos pequeños, juntos</Card.Title>
        <Card.Description>
          {formatMonthYear(small.month)}: {small.count} movimientos de hasta {formatPesos(SMALL_EXPENSE_MAX_CENTS)} que suman {formatPesos(small.totalCents)} ({formatPercent(small.shareOfSpend)} de tu gasto
          {small.previousTotalCents != null ? `; el mes anterior fueron ${formatPesos(small.previousTotalCents)}` : ""}).
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {small.groups.map((g) => (
          <ProgressListRow key={g.name} label={`${g.name} · ${g.count}`} value={formatPesos(g.totalCents)} percent={small.totalCents > 0 ? g.totalCents / small.totalCents : 0} />
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <TabbedSections
      title="Análisis del gasto"
      tabs={[
        { id: "merchants", label: "Comercios", count: merchants.ranked.length + (merchants.unidentified ? 1 : 0), content: merchantsCard },
        { id: "subscriptions", label: "Suscripciones", count: subscriptions?.services.length ?? 0, content: subscriptions && <SubscriptionsCard subscriptions={subscriptions} mergeAction={mergeAction} dissolveAction={dissolveAction} /> },
        { id: "small", label: "Gastos pequeños", count: small?.count ?? 0, content: smallCard },
      ]}
    />
  );
}
