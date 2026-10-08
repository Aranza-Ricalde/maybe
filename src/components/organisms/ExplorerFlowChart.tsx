"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Text } from "@/components/atoms/Text";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ExplorerBucket, ExplorerPoint } from "@/domain/explorer/rules";
import { formatCurrencyCompact, formatMonthYearShort, formatPesos, formatShortDate } from "@/lib/format";

const labelFor = (key: string, bucket: ExplorerBucket) => (bucket === "month" ? formatMonthYearShort(key) : formatShortDate(key));

const CONFIG = {
  Ingresos: { label: "Ingresos", color: "var(--success)" },
  Gastos: { label: "Gastos", color: "var(--danger)" },
} satisfies ChartConfig;

export interface ExplorerFlowChartProps {
  series: ExplorerPoint[];
  bucket: ExplorerBucket;
  showIncome: boolean;
}

export function ExplorerFlowChart({ series, bucket, showIncome }: ExplorerFlowChartProps) {
  const data = series.map((point) => ({ label: labelFor(point.key, bucket), Gastos: point.expenseCents, Ingresos: point.incomeCents }));

  if (data.every((d) => d.Gastos === 0 && d.Ingresos === 0)) return <Text tone="muted">Sin movimientos con estos filtros.</Text>;

  return (
    <ChartContainer config={CONFIG} className="h-56 w-full" role="img" aria-label="Gastos e ingresos por periodo">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={16} />
        <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent formatter={(value, name) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">{name}</span><span className="font-medium tabular-nums">{formatPesos(Number(value))}</span></span>} />} />
        {showIncome && <ChartLegend content={<ChartLegendContent />} />}
        {showIncome && <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={[4, 4, 0, 0]} isAnimationActive={false} />}
        <Bar dataKey="Gastos" fill="var(--color-Gastos)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
