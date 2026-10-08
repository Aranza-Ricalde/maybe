"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrencyCompact, formatPesos } from "@/lib/format";
import type { WaterfallStep } from "@/lib/presenters/charts";

const CONFIG = { value: { label: "Gasto", color: "var(--chart-1)" } } satisfies ChartConfig;
const FILL: Record<WaterfallStep["kind"], string> = { total: "var(--muted-foreground)", increase: "var(--danger)", decrease: "var(--success)" };

export function ExpenseWaterfallChart({ steps }: { steps: WaterfallStep[] }) {
  return (
    <ChartContainer config={CONFIG} className="h-64 w-full" role="img" aria-label="Qué cambió en tu gasto frente al periodo anterior">
      <BarChart data={steps} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
        <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(_value, _name, item) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{item.payload.label}</span>
                  <span className="font-medium tabular-nums">
                    {item.payload.kind === "increase" ? "+" : item.payload.kind === "decrease" ? "−" : ""}
                    {formatPesos(item.payload.value)}
                  </span>
                </span>
              )}
            />
          }
        />
        <Bar dataKey="base" stackId="cascada" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="value" stackId="cascada" radius={4} isAnimationActive={false}>
          {steps.map((step) => (
            <Cell key={step.label} fill={FILL[step.kind]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
