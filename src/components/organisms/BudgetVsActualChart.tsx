"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrencyCompact, formatPesos } from "@/lib/format";
import type { BudgetBar } from "@/lib/presenters/charts";

const CONFIG = {
  budgetCents: { label: "Presupuestado", color: "var(--muted-foreground)" },
  actualCents: { label: "Gastado", color: "var(--chart-1)" },
} satisfies ChartConfig;

const BAR_HEIGHT = 44;

export function BudgetVsActualChart({ bars }: { bars: BudgetBar[] }) {
  if (bars.length === 0) return null;

  return (
    <ChartContainer config={CONFIG} className="w-full" style={{ height: bars.length * BAR_HEIGHT + 56 }} role="img" aria-label="Presupuesto contra gasto por categoría">
      <BarChart data={bars} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
        <YAxis type="category" dataKey="name" width={96} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">{CONFIG[name as keyof typeof CONFIG]?.label ?? name}</span><span className="font-medium tabular-nums">{formatPesos(Number(value))}</span></span>} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="budgetCents" fill="var(--color-budgetCents)" fillOpacity={0.35} radius={4} isAnimationActive={false} />
        <Bar dataKey="actualCents" fill="var(--color-actualCents)" radius={4} isAnimationActive={false}>
          {bars.map((bar) => (
            <Cell key={bar.name} fill={bar.over ? "var(--danger)" : "var(--color-actualCents)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
