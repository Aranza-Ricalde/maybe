"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { Text } from "@/components/atoms/Text";
import type { ExplorerBucket, ExplorerPoint } from "@/domain/explorer/rules";
import { useIsClient } from "@/hooks/useIsClient";
import { formatMonthYearShort, formatPesos, formatShortDate } from "@/lib/format";

const CHART_HEIGHT = 224;

const labelFor = (key: string, bucket: ExplorerBucket) => (bucket === "month" ? formatMonthYearShort(key) : formatShortDate(key));

export interface ExplorerFlowChartProps {
  series: ExplorerPoint[];
  bucket: ExplorerBucket;
  showIncome: boolean;
}

function FlowTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-separator bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((item) => (
        <p key={String(item.dataKey)} className="tabular-nums text-muted">
          {item.name}: {formatPesos(Number(item.value))}
        </p>
      ))}
    </div>
  );
}

export function ExplorerFlowChart({ series, bucket, showIncome }: ExplorerFlowChartProps) {
  const mounted = useIsClient();
  const data = series.map((point) => ({ label: labelFor(point.key, bucket), Gastos: point.expenseCents, Ingresos: point.incomeCents }));

  if (data.every((d) => d.Gastos === 0 && d.Ingresos === 0)) return <Text tone="muted">Sin movimientos con estos filtros.</Text>;
  if (!mounted) return <div style={{ height: CHART_HEIGHT }} />;

  return (
    <div style={{ height: CHART_HEIGHT }} role="img" aria-label="Gastos e ingresos por periodo">
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={CHART_HEIGHT} initialDimension={{ width: 600, height: CHART_HEIGHT }}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--separator)" }} tick={{ fill: "var(--muted)", fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
          <YAxis width={56} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(value: number) => `$${Math.round(value / 100_000) / 10}k`} />
          <Tooltip content={FlowTooltip} cursor={{ fill: "var(--separator)", opacity: 0.4 }} />
          {showIncome && <Bar dataKey="Ingresos" fill="var(--success)" radius={[4, 4, 0, 0]} isAnimationActive={false} />}
          <Bar dataKey="Gastos" fill="var(--danger)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
