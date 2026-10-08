"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrencyCompact, formatPesos } from "@/lib/format";
import type { StatsChartModel } from "@/lib/presenters/stats";
import { cn } from "@/lib/utils";

const RANKING_ROW_HEIGHT = 40;
const DASH = "6 6";
const REFERENCE_COLOR = { danger: "var(--danger)", muted: "var(--muted-foreground)" } as const;

export interface TimeSeriesChartProps {
  model: StatsChartModel;
  ariaLabel: string;
  className?: string;
}

const tooltipRow = (label: string, cents: number) => (
  <span className="flex w-full justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium tabular-nums">{formatPesos(cents)}</span>
  </span>
);

export function TimeSeriesChart({ model, ariaLabel, className }: TimeSeriesChartProps) {
  const config = Object.fromEntries(model.series.map((series) => [series.key, { label: series.label, color: series.color }])) satisfies ChartConfig;
  const labelOf = (name: string | number | undefined) => config[String(name)]?.label ?? String(name);
  const tooltip = <ChartTooltipContent formatter={(value, name) => tooltipRow(String(labelOf(name)), Number(value))} />;
  const axisProps = { tickLine: false, axisLine: false } as const;
  const lastStacked = model.series.filter((series) => series.stacked).at(-1)?.key;

  if (model.kind === "ranking") {
    return (
      <ChartContainer config={config} className={cn("w-full", className)} style={{ height: model.data.length * RANKING_ROW_HEIGHT + 32 }} role="img" aria-label={ariaLabel}>
        <BarChart data={model.data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid horizontal={false} />
          <XAxis type="number" {...axisProps} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
          <YAxis type="category" dataKey="label" width={110} {...axisProps} />
          <ChartTooltip cursor={false} content={tooltip} />
          <Bar dataKey="value" fill="var(--color-value)" radius={4} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    );
  }

  if (model.kind === "lines") {
    return (
      <ChartContainer config={config} className={cn("h-72 w-full", className)} role="img" aria-label={ariaLabel}>
        <LineChart data={model.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" {...axisProps} tickMargin={8} minTickGap={40} />
          <YAxis width={64} {...axisProps} domain={["auto", "auto"]} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
          <ChartTooltip content={tooltip} />
          {model.references.map((reference) => (
            <ReferenceLine key={reference.label} y={reference.value} stroke={REFERENCE_COLOR[reference.tone ?? "danger"]} strokeDasharray="4 4" label={{ value: reference.label, position: "insideBottomRight", fill: REFERENCE_COLOR[reference.tone ?? "danger"], fontSize: 11 }} />
          ))}
          {model.marker && <ReferenceLine x={model.marker} stroke="var(--foreground)" strokeOpacity={0.3} label={{ value: "Hoy", position: "insideTopLeft", fontSize: 11, fill: "var(--foreground)" }} />}
          {model.series.map((series) => (
            <Line key={series.key} dataKey={series.key} type="monotone" stroke={`var(--color-${series.key})`} strokeWidth={2.5} strokeDasharray={series.dashed ? DASH : undefined} dot={false} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={config} className={cn("h-72 w-full", className)} role="img" aria-label={ariaLabel}>
      <BarChart data={model.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...axisProps} tickMargin={8} interval={model.data.length <= 12 ? 0 : "preserveStartEnd"} minTickGap={16} />
        <YAxis width={64} {...axisProps} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
        <ChartTooltip cursor={false} content={tooltip} />
        {model.series.map((series) => (
          <Bar
            key={series.key}
            dataKey={series.key}
            stackId={series.stacked ? "stack" : undefined}
            fill={`var(--color-${series.key})`}
            fillOpacity={series.faded ? 0.45 : 1}
            stroke={series.stacked ? "var(--card)" : undefined}
            strokeWidth={series.stacked ? 1.5 : 0}
            radius={series.stacked ? (series.key === lastStacked ? [4, 4, 0, 0] : 0) : 4}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
