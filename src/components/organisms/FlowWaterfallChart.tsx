"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { formatCurrency } from "@/lib/format";

const CHART_HEIGHT = 208;

interface FlowWaterfallChartProps {
  incomeCents: number;
  expenseCents: number;
  savingsCents: number;
  debtPaymentCents: number;
  remainingCents: number;
}

interface WaterfallDatum {
  name: string;
  base: number;
  value: number;
  delta: number;
  isTotal: boolean;
}

export function FlowWaterfallChart({ incomeCents, expenseCents, savingsCents, debtPaymentCents, remainingCents }: FlowWaterfallChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flag de "ya estamos en el cliente", patrón intencional (no sincroniza con nada externo, es un solo re-render extra a propósito).
    setMounted(true);
  }, []);

  let cumulative = 0;
  const steps: Array<{ name: string; delta: number }> = [
    { name: "Ingresos", delta: incomeCents },
    { name: "Gastos", delta: expenseCents },
    { name: "Ahorro", delta: savingsCents },
    { name: "Deudas", delta: debtPaymentCents },
  ];
  const data: WaterfallDatum[] = steps.map((s) => {
    const start = cumulative;
    cumulative += s.delta;
    return { name: s.name, base: Math.min(start, cumulative), value: Math.abs(s.delta), delta: s.delta, isTotal: false };
  });
  data.push({ name: "Disponible", base: Math.min(0, cumulative), value: Math.abs(cumulative), delta: remainingCents, isTotal: true });

  function colorFor(d: WaterfallDatum): string {
    if (d.isTotal) return d.delta < 0 ? "var(--danger)" : "var(--accent)";
    return d.delta >= 0 ? "var(--success)" : "var(--muted)";
  }

  if (!mounted) {
    return <div className="h-52 w-full" />;
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={CHART_HEIGHT} initialDimension={{ width: 400, height: CHART_HEIGHT }}>
        <BarChart data={data} margin={{ top: 24, right: 8, left: 8, bottom: 0 }} barCategoryGap="25%">
          <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "var(--separator)" }} tick={{ fill: "var(--muted)", fontSize: 11 }} />
          <Tooltip content={WaterfallTooltip} cursor={{ fill: "var(--separator)", opacity: 0.4 }} />
          <Bar dataKey="base" stackId="flow" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="value" stackId="flow" maxBarSize={40} radius={4} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={colorFor(d)} />
            ))}
            <LabelList
              dataKey="delta"
              position="top"
              formatter={(label) => (typeof label === "number" ? `${label > 0 ? "+" : ""}${formatCurrency(label)}` : "")}
              style={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WaterfallTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload as WaterfallDatum | undefined;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-separator bg-surface p-2 text-xs shadow-lg">
      <CurrencyText cents={d.delta} withSign size="xs" weight="semibold" />
      <Text size="xs" tone="muted">
        {d.name}
      </Text>
    </div>
  );
}
