"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Text } from "@/components/atoms/Text";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrency, formatCurrencyCompact, formatMonthYearShort, formatShortDate } from "@/lib/format";

export interface LineEvolutionPoint {
  date: string;
  value: number;
}

export interface LineEvolutionChartProps {
  series: LineEvolutionPoint[];
  dateGranularity: "daily" | "monthly";
  emptyMessage: string;
  tableCaption: string;
}

const CONFIG = { value: { label: "Saldo", color: "var(--chart-1)" } } satisfies ChartConfig;

export function LineEvolutionChart({ series, dateGranularity, emptyMessage, tableCaption }: LineEvolutionChartProps) {
  const formatDate = dateGranularity === "daily" ? formatShortDate : formatMonthYearShort;

  if (series.length < 2) return <Text tone="muted">{emptyMessage}</Text>;

  return (
    <ChartContainer config={CONFIG} className="h-48 w-full" role="img" aria-label={`${tableCaption}: de ${formatCurrency(series[0].value)} a ${formatCurrency(series[series.length - 1].value)}`}>
      <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-evolution" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={formatDate} />
        <YAxis width={64} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" labelFormatter={(_, items) => formatDate(String(items[0]?.payload.date))} formatter={(value) => <span className="font-medium tabular-nums">{formatCurrency(Number(value))}</span>} />} />
        <Area dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} fill="url(#fill-evolution)" isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  );
}
