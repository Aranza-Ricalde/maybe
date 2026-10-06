"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@heroui/react";
import { formatCurrency, formatCurrencyCompact, formatMonthYearShort } from "@/lib/format";
import { useIsClient } from "@/hooks/useIsClient";

export interface ProjectionChartPoint {
  label: string;
  baseline: number;
  scenario: number;
}

export function ProjectionBalanceChart({ data, basisMonths, hasScenario }: { data: ProjectionChartPoint[]; basisMonths: string[]; hasScenario: boolean }) {
  const mounted = useIsClient();

  return (
    <Card className="min-w-0 p-5">
      <Card.Header>
        <Card.Title>Hacia dónde va tu saldo</Card.Title>
        <Card.Description>
          {basisMonths.length > 0
            ? `Con el promedio de ${basisMonths.length} ${basisMonths.length === 1 ? "mes completo" : "meses completos"}: ${basisMonths.map((m) => formatMonthYearShort(m)).join(", ")}.`
            : "Todavía no hay meses completos con movimientos para promediar."}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="h-72 w-full">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={280} initialDimension={{ width: 600, height: 280 }}>
              <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid stroke="var(--separator)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v)} tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} width={64} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid var(--separator)", background: "var(--surface)" }} />
                <Line type="monotone" dataKey="baseline" name="Sin cambios" stroke="var(--muted)" strokeWidth={2} dot={false} isAnimationActive={false} strokeDasharray={hasScenario ? "5 4" : undefined} />
                {hasScenario && <Line type="monotone" dataKey="scenario" name="Con tu escenario" stroke="var(--accent)" strokeWidth={2.5} dot={false} isAnimationActive={false} />}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
