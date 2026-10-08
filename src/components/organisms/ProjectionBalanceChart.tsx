"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrency, formatCurrencyCompact, formatMonthYearShort } from "@/lib/format";

const CONFIG = {
  baseline: { label: "Sin cambios", color: "var(--muted-foreground)" },
  scenario: { label: "Con tu escenario", color: "var(--chart-1)" },
} satisfies ChartConfig;

export interface ProjectionChartPoint {
  label: string;
  baseline: number;
  scenario: number;
}

export function ProjectionBalanceChart({ data, basisMonths, hasScenario }: { data: ProjectionChartPoint[]; basisMonths: string[]; hasScenario: boolean }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Hacia dónde va tu saldo</CardTitle>
        <CardDescription>
          {basisMonths.length > 0
            ? `Con el promedio de ${basisMonths.length} ${basisMonths.length === 1 ? "mes completo" : "meses completos"}: ${basisMonths.map((m) => formatMonthYearShort(m)).join(", ")}.`
            : "Todavía no hay meses completos con movimientos para promediar."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={CONFIG} className="h-72 w-full">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v)} tickLine={false} axisLine={false} width={64} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">{CONFIG[name as keyof typeof CONFIG]?.label ?? name}</span><span className="font-medium tabular-nums">{formatCurrency(Number(value))}</span></span>} />} />
            {hasScenario && <ChartLegend content={<ChartLegendContent />} />}
            <Line type="monotone" dataKey="baseline" stroke="var(--color-baseline)" strokeWidth={2} dot={false} isAnimationActive={false} strokeDasharray={hasScenario ? "5 4" : undefined} />
            {hasScenario && <Line type="monotone" dataKey="scenario" stroke="var(--color-scenario)" strokeWidth={2.5} dot={false} isAnimationActive={false} />}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
