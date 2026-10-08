"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrencyCompact, formatPesos } from "@/lib/format";
import type { StackedSpending } from "@/lib/presenters/charts";

export function SpendingStackedChart({ series }: { series: StackedSpending }) {
  const config = Object.fromEntries(series.keys.map((key) => [key.key, { label: key.label, color: key.color }])) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-64 w-full" role="img" aria-label="Gasto mensual por categoría">
      <BarChart data={series.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">{config[String(name)]?.label ?? name}</span><span className="font-medium tabular-nums">{formatPesos(Number(value))}</span></span>} />} />
        <ChartLegend content={<ChartLegendContent />} />
        {series.keys.map((key, index) => (
          <Bar key={key.key} dataKey={key.key} stackId="gasto" fill={`var(--color-${key.key})`} radius={index === series.keys.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
