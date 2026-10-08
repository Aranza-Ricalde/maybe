"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { Text } from "@/components/atoms/Text";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { GoalRing } from "@/lib/presenters/charts";

export function GoalRingsChart({ rings }: { rings: GoalRing[] }) {
  if (rings.length === 0) return null;
  const config = Object.fromEntries(rings.map((ring) => [ring.key, { label: ring.name, color: ring.fill }])) satisfies ChartConfig;
  const data = rings.map((ring) => ({ ...ring, value: ring.percent }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avance de tus metas</CardTitle>
        <CardDescription>Cada anillo es una meta; el anillo exterior es la primera.</CardDescription>
      </CardHeader>
      <CardContent className="grid items-center gap-6 sm:grid-cols-[14rem_minmax(0,1fr)]">
        <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-56" role="img" aria-label="Avance de tus metas">
          <RadialBarChart data={data} innerRadius="40%" outerRadius="100%" barSize={14} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value, _name, item) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">{item.payload.name}</span><span className="font-medium tabular-nums">{String(value)}%</span></span>} />} />
            <RadialBar dataKey="value" background cornerRadius={6} isAnimationActive={false} />
          </RadialBarChart>
        </ChartContainer>
        <ul className="flex flex-col gap-2">
          {rings.map((ring) => (
            <li key={ring.key} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: ring.fill }} />
                <Text size="sm" weight="medium" className="truncate">
                  {ring.name}
                </Text>
              </span>
              <Text size="sm" tone="muted" className="shrink-0 tabular-nums">
                {ring.percent}%
              </Text>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
