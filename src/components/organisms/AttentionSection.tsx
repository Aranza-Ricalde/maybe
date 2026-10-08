"use client";

import { Target, TrendingDown, TriangleAlert, TrendingUp, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { DecisionButtons } from "@/components/molecules/DecisionButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Insight, InsightTone } from "@/domain/insights/rules";
import type { FormAction } from "@/lib/actionResult";
import { VISIBLE_INSIGHTS, splitInsights, type AttentionDecision, type DecisionKind } from "@/lib/presenters/attention";
import { cn } from "@/lib/utils";

const TONE: Record<InsightTone, { icon: LucideIcon; tile: string }> = {
  positive: { icon: TrendingUp, tile: "bg-success/10 text-success" },
  change: { icon: TrendingDown, tile: "bg-danger/10 text-danger" },
  attention: { icon: TriangleAlert, tile: "bg-warning/10 text-warning" },
  goal: { icon: Target, tile: "bg-primary/10 text-primary" },
};

export interface AttentionSectionProps {
  decisions: AttentionDecision[];
  insights: Insight[];
  actions: Record<DecisionKind, { confirm: FormAction; dismiss: FormAction }>;
}

function InsightTile({ insight }: { insight: Insight }) {
  const { icon: Icon, tile } = TONE[insight.tone];
  return (
    <li className="flex items-start gap-3 rounded-lg border p-3">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", tile)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug font-medium">{insight.message}</p>
        {insight.detail && <p className="mt-0.5 text-xs text-muted-foreground">{insight.detail}</p>}
      </div>
      {insight.href && (
        <Link href={insight.href} className="shrink-0 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Ver
        </Link>
      )}
    </li>
  );
}

export function AttentionSection({ decisions, insights, actions }: AttentionSectionProps) {
  const { top } = splitInsights(insights, VISIBLE_INSIGHTS);
  if (decisions.length === 0 && insights.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {decisions.length > 0 && (
        <Card aria-label="Pendientes">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pendientes
              <span className="rounded-full bg-foreground px-2 text-xs font-medium text-background tabular-nums">{decisions.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {decisions.map((decision) => (
                <li key={decision.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{decision.title}</p>
                    <p className="text-xs text-muted-foreground">{decision.detail}</p>
                  </div>
                  <DecisionButtons id={decision.id} confirmAction={actions[decision.kind].confirm} dismissAction={actions[decision.kind].dismiss} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {insights.length > 0 && (
        <Card aria-label="Avisos sobre tus finanzas">
          <CardHeader>
            <CardTitle>Avisos sobre tus finanzas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ul className="flex flex-col gap-2">
              {top.map((insight) => (
                <InsightTile key={insight.id} insight={insight} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
