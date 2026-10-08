"use client";

import { Table2 } from "lucide-react";
import { useState } from "react";
import type { FormAction } from "@/lib/actionResult";
import { Text } from "@/components/atoms/Text";
import { EmptyState } from "@/components/molecules/EmptyState";
import { MetricStrip } from "@/components/molecules/MetricStrip";
import { PageHeader } from "@/components/molecules/PageHeader";
import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { SeriesLegend } from "@/components/molecules/SeriesLegend";
import { CategoryStatsTable } from "@/components/organisms/CategoryStatsTable";
import { FinancialStatusBanner } from "@/components/organisms/FinancialStatusBanner";
import { ProjectionDetails } from "@/components/organisms/ProjectionDetails";
import { ScenarioSheet } from "@/components/organisms/ScenarioSheet";
import { StatsControls } from "@/components/organisms/StatsControls";
import { StatsTable } from "@/components/organisms/StatsTable";
import { StatsToolbar } from "@/components/organisms/StatsToolbar";
import { TimeSeriesChart } from "@/components/organisms/TimeSeriesChart";
import { UncategorizedSpendingAlert } from "@/components/organisms/UncategorizedSpendingAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StatsPageView } from "@/application/pages/getStatsPage";
import { statsRange } from "@/domain/stats/params";
import type { StatsParams } from "@/domain/stats/params";
import { useStats, type LoadStats } from "@/hooks/useStats";
import { STATS_GROUP_LABELS, buildLegend, buildStatsChart, buildStatsMetrics, buildStatsTable, isEmptyChart, type StatsTableRow } from "@/lib/presenters/stats";
import { canCompare } from "@/lib/presenters/statsControls";

export interface StatsPageTemplateProps {
  initialParams: StatsParams;
  page: StatsPageView;
  loadAction: LoadStats;
  minimumAction: FormAction;
}

export function StatsPageTemplate({ initialParams, page, loadAction, minimumAction }: StatsPageTemplateProps) {
  const stats = useStats(initialParams, page.data, loadAction);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);
  const { params, update, clearFilters, shown, isLoading, hasFailed } = stats;
  const { data } = shown;

  const chart = buildStatsChart(shown.params, data);
  const legend = buildLegend(chart);
  const table = buildStatsTable(shown.params, data);
  const metrics = buildStatsMetrics(shown.params, data, page.categoryStats);
  const range = statsRange(shown.params, page.today, null);
  const drillParent = data.explorer.drillParent;
  const showProjection = shown.params.projection && data.projection;

  const selectRow = (row: StatsTableRow) => {
    if (shown.params.group === "category" && row.categoryId != null) update({ categoryId: row.categoryId });
    if (shown.params.group === "merchant" && row.merchant) update({ merchant: row.merchant });
  };
  const isSelectable = (row: StatsTableRow) => (shown.params.group === "category" ? row.categoryId != null : shown.params.group === "merchant");

  return (
    <>
      <PageHeader
        title="Estadísticas"
        action={
          <StatsToolbar
            params={params}
            range={{ from: data.explorer.from || range.from, to: data.explorer.to || range.to }}
            accounts={page.options.accounts}
            categories={page.options.categories}
            result={data.explorer}
            canCompare={canCompare(params)}
            onChange={update}
            onClearFilters={clearFilters}
          />
        }
      />

      <MetricStrip metrics={metrics} />

      {showProjection && data.projection && <FinancialStatusBanner status={data.projection.status} />}

      <StatsControls params={params} canSimulate onChange={update} onSimulate={() => setIsSimulating(true)} />

      <Card className={`transition-opacity ${isLoading ? "opacity-50" : "opacity-100"}`} aria-busy={isLoading} aria-label="Gráfica">
        <CardContent className="flex flex-col gap-3">
        {drillParent && (
          <Text size="xs" tone="muted">
            Subcategorías de {drillParent.name}.{" "}
            <Button type="button" variant="link" size="xs" className="h-auto p-0" onClick={() => update({ categoryId: null })}>
              Ver todas las categorías
            </Button>
          </Text>
        )}
        {hasFailed ? (
          <Text tone="muted">No se pudo cargar esta vista. Revisa el rango de fechas e inténtalo de nuevo.</Text>
        ) : isEmptyChart(chart) ? (
          <EmptyState title="Nada que mostrar en este rango" description="Prueba con otro periodo, otra métrica o quita algún filtro." />
        ) : (
          <>
            <SeriesLegend items={legend} onSelect={(key) => { const item = legend.find((entry) => entry.key === key); if (item?.categoryId != null) update({ categoryId: item.categoryId }); }} />
            <TimeSeriesChart model={chart} ariaLabel={`Estadísticas de ${STATS_GROUP_LABELS[shown.params.group].toLowerCase()}`} />
          </>
        )}
        </CardContent>
      </Card>

      {table && table.rows.length > 0 && <StatsTable model={table} nameColumn={STATS_GROUP_LABELS[shown.params.group]} title={`Detalle por ${STATS_GROUP_LABELS[shown.params.group].toLowerCase()}`} isSelectable={isSelectable} onSelect={selectRow} />}

      {showProjection && data.projection && <ProjectionDetails view={data.projection} minimumAction={minimumAction} />}

      {shown.params.metric === "expense" && (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsMonthly(true)}>
            <Table2 />
            Ver detalle mes a mes
          </Button>
          <ResponsiveDialog open={isMonthly} onOpenChange={setIsMonthly} title="Detalle mes a mes" description="Gasto por categoría en los últimos 6 meses." size="xl">
            <CategoryStatsTable stats={page.categoryStats} />
          </ResponsiveDialog>
        </div>
      )}

      <UncategorizedSpendingAlert stats={page.categoryStats} />

      <ScenarioSheet open={isSimulating} onOpenChange={setIsSimulating} simulator={page.simulator} />
    </>
  );
}
