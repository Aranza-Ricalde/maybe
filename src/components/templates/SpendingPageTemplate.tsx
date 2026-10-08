import type { FormAction } from "@/lib/actionResult";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { SpendingAnalysisView } from "@/application/getSpendingAnalysis";
import { StatBlock } from "@/components/molecules/StatBlock";
import { StatBlockRow } from "@/components/molecules/StatBlockRow";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { CategoryStatsTable } from "@/components/organisms/CategoryStatsTable";
import { NatureBreakdownCard } from "@/components/organisms/NatureBreakdownCard";
import { SpendingAnalysisSection } from "@/components/organisms/SpendingAnalysisSection";
import { discretionaryActions } from "@/domain/categoryStats/opportunities";
import { UNCATEGORIZED_ID, type CategoryStats } from "@/domain/categoryStats/rules";
import { ROUTES } from "@/domain/shared/routes";
import { formatPercent, formatPesos, formatSignedPercent } from "@/lib/format";

const UNCATEGORIZED_WARNING_SHARE = 0.05;

export interface SpendingPageTemplateProps {
  stats: CategoryStats;
  analysis: SpendingAnalysisView;
  mergeSubscriptionsAction: FormAction;
  dissolveSubscriptionAction: FormAction;
}

export function SpendingPageTemplate({ stats, analysis, mergeSubscriptionsAction, dissolveSubscriptionAction }: SpendingPageTemplateProps) {
  const uncategorized = stats.rows.find((r) => r.categoryId === UNCATEGORIZED_ID);
  const showWarning = uncategorized != null && uncategorized.shareOfWindow >= UNCATEGORIZED_WARNING_SHARE;
  const { totals } = stats;
  const trend = totals.deltaCents > 0 ? "danger" : totals.deltaCents < 0 ? "success" : "default";

  return (
    <>
      <PageHeader title="Gasto por categoría" subtitle="En qué se va tu dinero mes a mes y qué cambió." />

      {stats.rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="Todavía no hay gasto que analizar" description="Registra movimientos y aquí verás cuánto gastas en cada categoría." />
          </CardContent>
        </Card>
      ) : (
        <>
          <StatBlockRow>
            <StatBlock label="Promedio mensual" value={formatPesos(totals.avgLast3Cents)} tooltip="Promedio de tus últimos meses completos, sin contar el mes en curso." hint={<p className="mt-1 text-xs text-muted-foreground">{formatPesos(totals.windowCents)} en {stats.completedMonths.length} {stats.completedMonths.length === 1 ? "mes" : "meses"}</p>} />
            <StatBlock
              label="Último mes vs anterior"
              value={`${totals.deltaCents > 0 ? "+" : totals.deltaCents < 0 ? "−" : ""}${formatPesos(Math.abs(totals.deltaCents))}`}
              tone={trend}
              hint={<p className="mt-1 text-xs text-muted-foreground">{totals.deltaPct != null ? formatSignedPercent(totals.deltaPct) : "Sin mes anterior para comparar"}</p>}
            />
            <StatBlock label="Categorías con gasto" value={String(stats.rows.filter((r) => r.depth === 0).length)} hint={<p className="mt-1 text-xs text-muted-foreground">{uncategorized ? `${formatPercent(uncategorized.shareOfWindow)} del gasto sin categoría` : "Todo el gasto está categorizado"}</p>} />
          </StatBlockRow>

          {showWarning && uncategorized && (
            <Alert variant="warning">
              <TriangleAlert />
              <AlertTitle>
                {formatPesos(uncategorized.windowCents)} ({formatPercent(uncategorized.shareOfWindow)} de tu gasto) no tiene categoría
              </AlertTitle>
              <AlertDescription>
                Suelen ser pagos de tarjeta o transferencias propias registrados como gasto, lo que cuenta el mismo dinero dos veces. Revísalos en{" "}
                <Link href={ROUTES.transactions} className="font-medium underline">
                  Movimientos
                </Link>{" "}
                para que estas cifras reflejen lo que de verdad gastas.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent>
              <CategoryStatsTable stats={stats} />
            </CardContent>
          </Card>
        </>
      )}

      <NatureBreakdownCard natures={stats.natures} actions={discretionaryActions(stats)} />

      <SpendingAnalysisSection analysis={analysis} mergeAction={mergeSubscriptionsAction} dissolveAction={dissolveSubscriptionAction} />
    </>
  );
}
