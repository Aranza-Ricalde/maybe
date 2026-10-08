import type { FormAction } from "@/lib/actionResult";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/atoms/Text";
import { ProgressListRow } from "@/components/molecules/ProgressListRow";
import type { SpendingAnalysisView } from "@/application/getSpendingAnalysis";
import { SMALL_EXPENSE_MAX_CENTS } from "@/domain/spendingAnalysis/rules";
import { formatMonthYear, formatPercent, formatPesos } from "@/lib/format";
import { SubscriptionsCard } from "./SubscriptionsCard";
import { TabbedSections } from "./TabbedSections";

export interface SpendingAnalysisSectionProps {
  analysis: SpendingAnalysisView;
  mergeAction: FormAction;
  dissolveAction: FormAction;
}

export function SpendingAnalysisSection({ analysis, mergeAction, dissolveAction }: SpendingAnalysisSectionProps) {
  const { small, merchants, subscriptions, monthsAnalyzed } = analysis;

  const merchantsCard = (
    <Card>
      <CardHeader>
        <CardTitle>Comercios que más consumen</CardTitle>
        <CardDescription>Solo comercios identificados, últimos {monthsAnalyzed} meses completos, de mayor a menor.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {merchants.ranked.map((m) => (
          <ProgressListRow key={m.merchant} label={`${m.merchant} · ${m.count}`} value={formatPesos(m.totalCents)} percent={merchants.ranked[0].totalCents > 0 ? m.totalCents / merchants.ranked[0].totalCents : 0} />
        ))}
        {merchants.unidentified && (
          <Text size="xs" tone="muted" className="border-t border-border pt-3">
            Sin comercio identificado: {formatPesos(merchants.unidentified.totalCents)} en {merchants.unidentified.count} movimientos ({formatPercent(merchants.unidentified.shareOfSpend)} de tu gasto). Incluye pagos a personas y descripciones libres.
          </Text>
        )}
      </CardContent>
    </Card>
  );

  const smallCard = small && (
    <Card>
      <CardHeader>
        <CardTitle>Tus gastos pequeños, juntos</CardTitle>
        <CardDescription>
          {formatMonthYear(small.month)}: {small.count} movimientos de hasta {formatPesos(SMALL_EXPENSE_MAX_CENTS)} que suman {formatPesos(small.totalCents)} ({formatPercent(small.shareOfSpend)} de tu gasto
          {small.previousTotalCents != null ? `; el mes anterior fueron ${formatPesos(small.previousTotalCents)}` : ""}).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {small.groups.map((g) => (
          <ProgressListRow key={g.name} label={`${g.name} · ${g.count}`} value={formatPesos(g.totalCents)} percent={small.totalCents > 0 ? g.totalCents / small.totalCents : 0} />
        ))}
      </CardContent>
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
