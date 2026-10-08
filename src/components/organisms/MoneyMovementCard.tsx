"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { DayFlow } from "@/domain/dashboard/movement";
import { formatCurrencyCompact, formatCurrency, formatSignedPesos } from "@/lib/format";
import { movementChartData, movementTotals } from "@/lib/presenters/dashboard";

const config = { moneyIn: { label: "Entró", color: "var(--color-primary)" }, moneyOut: { label: "Salió", color: "var(--color-muted-foreground)" } } satisfies ChartConfig;

export function MoneyMovementCard({ days }: { days: DayFlow[] }) {
  const { inCents: totalIn, outCents: totalOut, netCents: net } = movementTotals(days);

  return (
    <Card aria-label="Movimiento de dinero">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">Movimiento de dinero</CardTitle>
        <span className="text-xs text-muted-foreground">Últimos 7 días</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/30">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <ArrowDownLeft className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/70">Entró</p>
              <p className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{formatCurrency(totalIn)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 px-3 py-2.5 dark:bg-rose-950/30">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/50">
              <ArrowUpRight className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-rose-600/70 dark:text-rose-400/70">Salió</p>
              <p className="text-sm font-bold tabular-nums text-rose-700 dark:text-rose-300">{formatCurrency(totalOut)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <span className="text-xs text-muted-foreground">Flujo neto</span>
          <span className={`text-sm font-bold tabular-nums ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{formatSignedPesos(net)}</span>
        </div>

        <ChartContainer config={config} className="h-[180px] w-full" role="img" aria-label="Entradas y salidas de los últimos 7 días">
          <BarChart data={movementChartData(days)} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" strokeOpacity={0.4} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} tickMargin={6} />
            <YAxis domain={[0, (max: number) => Math.max(max, 100000)]} tickLine={false} axisLine={false} fontSize={11} tickMargin={4} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => `${String(config[name as keyof typeof config]?.label ?? name)}: ${formatCurrency(Number(value))}`} />} />
            <Bar dataKey="moneyIn" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            <Bar dataKey="moneyOut" fill="var(--color-muted-foreground)" fillOpacity={0.25} radius={[6, 6, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
