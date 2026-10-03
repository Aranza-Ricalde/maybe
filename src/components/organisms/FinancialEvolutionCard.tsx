"use client";

import { useState } from "react";
import { Card } from "@heroui/react";
import { LineEvolutionChart } from "./LineEvolutionChart";
import { EVOLUTION_METRICS, EVOLUTION_RANGES, type EvolutionMetric, type EvolutionPoint, type EvolutionRangeKey } from "@/domain/evolution/rules";

const METRIC_LABELS: Record<EvolutionMetric, string> = { balance: "Saldo", income: "Ingresos", expense: "Gastos", savings: "Ahorro" };
const RANGE_LABELS: Record<EvolutionRangeKey, string> = { "30d": "30 días", "3m": "3 meses", "6m": "6 meses", "1y": "1 año" };

export type EvolutionDataset = Record<EvolutionMetric, Record<EvolutionRangeKey, EvolutionPoint[]>>;

export function FinancialEvolutionCard({ data }: { data: EvolutionDataset }) {
  const [metric, setMetric] = useState<EvolutionMetric>("balance");
  const [range, setRange] = useState<EvolutionRangeKey>("30d");

  const series = data[metric][range];

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Evolución financiera</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {EVOLUTION_METRICS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  metric === m ? "bg-accent text-accent-foreground" : "text-muted hover:bg-separator"
                }`}
              >
                {METRIC_LABELS[m]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EVOLUTION_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r ? "bg-separator text-foreground" : "text-muted hover:bg-separator"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <LineEvolutionChart
            series={series}
            dateGranularity={range === "30d" ? "daily" : "monthly"}
            emptyMessage="Todavía no hay suficientes datos para graficar esta combinación."
            tableCaption={`${METRIC_LABELS[metric]} — ${RANGE_LABELS[range]}`}
          />
        </div>
      </Card.Content>
    </Card>
  );
}
