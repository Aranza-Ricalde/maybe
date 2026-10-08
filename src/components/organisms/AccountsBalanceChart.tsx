"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Text } from "@/components/atoms/Text";
import { EvolutionRangeButtons } from "@/components/molecules/EvolutionRangeButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { AccountsBalanceHistory } from "@/application/getAccountsBalanceHistory";
import { useAccountsHistory, type LoadAccountsHistory } from "@/hooks/useAccountsHistory";
import { formatCurrency, formatCurrencyCompact, formatMonthYearShort, formatShortDate } from "@/lib/format";
import { CHART_COLOR_VARS } from "@/lib/presenters/charts";

export interface AccountsBalanceChartProps {
  initial: AccountsBalanceHistory;
  load: LoadAccountsHistory;
}

export function AccountsBalanceChart({ initial, load }: AccountsBalanceChartProps) {
  const { range, history, isLoading, selectRange } = useAccountsHistory(initial, load);
  const formatDate = range === "30d" ? formatShortDate : formatMonthYearShort;
  const config = Object.fromEntries(history.accounts.map((account, index) => [account.key, { label: account.label, color: CHART_COLOR_VARS[index % CHART_COLOR_VARS.length] }])) satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo de tus cuentas</CardTitle>
        <CardDescription>Una línea por cuenta: las 5 con más saldo del periodo.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <EvolutionRangeButtons value={range} onChange={selectRange} />
        {history.points.length < 2 ? (
          <Text tone="muted">Todavía no hay suficientes datos para graficar tus cuentas.</Text>
        ) : (
          <ChartContainer config={config} className={isLoading ? "h-64 w-full opacity-50" : "h-64 w-full"} role="img" aria-label="Saldo de cada cuenta en el tiempo">
            <LineChart data={history.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(value: string) => formatDate(value)} />
              <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyCompact(value)} />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, items) => formatDate(String(items[0]?.payload.date))} formatter={(value, name) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">{config[String(name)]?.label ?? name}</span><span className="font-medium tabular-nums">{formatCurrency(Number(value))}</span></span>} />} />
              <ChartLegend content={<ChartLegendContent />} />
              {history.accounts.map((account) => (
                <Line key={account.key} dataKey={account.key} type="monotone" stroke={`var(--color-${account.key})`} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
