"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Text } from "@/components/atoms/Text";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatPesos } from "@/lib/format";
import type { DonutSlice } from "@/lib/presenters/charts";

export interface ShareDonutChartProps {
  slices: DonutSlice[];
  totalCents: number;
  label: string;
}

export function ShareDonutChart({ slices, totalCents, label }: ShareDonutChartProps) {
  const config = Object.fromEntries(slices.map((slice) => [slice.key, { label: slice.name, color: slice.fill }])) satisfies ChartConfig;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-56">
      <ChartContainer config={config} className="size-full" role="img" aria-label={`${label}: ${formatPesos(totalCents)}`}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="key" formatter={(value, _name, item) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">{item.payload.name}</span><span className="font-medium tabular-nums">{formatPesos(Number(value))}</span></span>} />} />
          <Pie data={slices} dataKey="value" nameKey="key" innerRadius="62%" outerRadius="92%" paddingAngle={1} strokeWidth={0} isAnimationActive={false}>
            {slices.map((slice) => (
              <Cell key={slice.key} fill={slice.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <Text size="xs" tone="muted">
          {label}
        </Text>
        <p className="text-lg font-semibold tabular-nums">{formatPesos(totalCents)}</p>
      </div>
    </div>
  );
}
