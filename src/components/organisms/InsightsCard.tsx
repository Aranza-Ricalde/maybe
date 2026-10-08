import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/molecules/StatusDot";
import type { StatusLevel } from "@/components/molecules/StatusTheme";
import { Text } from "@/components/atoms/Text";
import type { Insight, InsightTone } from "@/domain/insights/rules";

const TONE_LEVEL: Record<Exclude<InsightTone, "goal">, StatusLevel> = { positive: "green", change: "red", attention: "yellow" };

export function InsightsCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>¿Qué está pasando?</CardTitle>
        <CardDescription>Lo que cambió en tus finanzas, con los datos que lo respaldan.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y divide-border">
          {insights.map((insight) => (
            <li key={insight.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
              {insight.tone === "goal" ? (
                <span aria-hidden className="text-sm leading-5">🎯</span>
              ) : (
                <span className="mt-1.5">
                  <StatusDot level={TONE_LEVEL[insight.tone]} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{insight.message}</p>
                {insight.detail && (
                  <Text size="xs" tone="muted">
                    {insight.detail}
                  </Text>
                )}
              </div>
              {insight.href && (
                <Link href={insight.href} className="shrink-0 text-xs text-primary hover:underline">
                  Ver movimientos →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
