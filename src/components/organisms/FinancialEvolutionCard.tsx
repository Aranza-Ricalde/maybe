"use client";

import { useState, useTransition } from "react";
import { Card } from "@heroui/react";
import { EVOLUTION_RANGE_LABELS, EvolutionRangeButtons } from "@/components/molecules/EvolutionRangeButtons";
import { ACTIVE_ACCENT, SegmentedButtons } from "@/components/molecules/SegmentedButtons";
import { LineEvolutionChart } from "./LineEvolutionChart";
import { EVOLUTION_METRICS, type EvolutionMetric, type EvolutionPoint, type EvolutionRangeKey } from "@/domain/evolution/rules";

const METRIC_LABELS: Record<EvolutionMetric, string> = { balance: "Saldo", netWorth: "Patrimonio", debt: "Deuda", income: "Ingresos", expense: "Gastos", savings: "Ahorro" };
const METRIC_OPTIONS = EVOLUTION_METRICS.map((metric) => ({ value: metric, label: METRIC_LABELS[metric] }));

const DEFAULT_METRIC: EvolutionMetric = "balance";
const DEFAULT_RANGE: EvolutionRangeKey = "30d";

const seriesKey = (metric: EvolutionMetric, range: EvolutionRangeKey) => `${metric}:${range}`;

export interface FinancialEvolutionCardProps {
  initialSeries: EvolutionPoint[];
  loadSeries: (metric: EvolutionMetric, range: EvolutionRangeKey) => Promise<EvolutionPoint[]>;
}

export function FinancialEvolutionCard({ initialSeries, loadSeries }: FinancialEvolutionCardProps) {
  const [metric, setMetric] = useState<EvolutionMetric>(DEFAULT_METRIC);
  const [range, setRange] = useState<EvolutionRangeKey>(DEFAULT_RANGE);
  const [loaded, setLoaded] = useState<Record<string, EvolutionPoint[]>>({ [seriesKey(DEFAULT_METRIC, DEFAULT_RANGE)]: initialSeries });
  const [isLoading, startLoading] = useTransition();

  const series = loaded[seriesKey(metric, range)];

  function select(nextMetric: EvolutionMetric, nextRange: EvolutionRangeKey) {
    setMetric(nextMetric);
    setRange(nextRange);
    const key = seriesKey(nextMetric, nextRange);
    if (loaded[key]) return;
    startLoading(async () => {
      const loadedSeries = await loadSeries(nextMetric, nextRange);
      setLoaded((current) => ({ ...current, [key]: loadedSeries }));
    });
  }

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Evolución financiera</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedButtons options={METRIC_OPTIONS} value={metric} onChange={(next) => select(next, range)} activeClassName={ACTIVE_ACCENT} />
          <EvolutionRangeButtons value={range} onChange={(next) => select(metric, next)} />
        </div>

        <div className="mt-5">
          {series ? (
            <LineEvolutionChart
              series={series}
              dateGranularity={range === "30d" ? "daily" : "monthly"}
              emptyMessage="Todavía no hay suficientes datos para graficar esta combinación."
              tableCaption={`${METRIC_LABELS[metric]} — ${EVOLUTION_RANGE_LABELS[range]}`}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted" aria-live="polite">
              {isLoading ? "Cargando…" : "No se pudo cargar esta combinación."}
            </p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
