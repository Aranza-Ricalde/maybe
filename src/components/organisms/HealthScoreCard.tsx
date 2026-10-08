import { HeartPulse, Landmark, PiggyBank, Receipt, Shield, ShoppingCart, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { healthLevel, type HealthKey, type HealthLevel, type HealthScore } from "@/domain/dashboard/health";
import { HEALTH_LABELS, HEALTH_LEVEL_LABELS } from "@/lib/presenters/dashboard";

const ICONS: Record<HealthKey, LucideIcon> = { savings: PiggyBank, spending: ShoppingCart, debt: Landmark, emergency: Shield, bills: Receipt };
const GAUGE: Record<HealthLevel, string> = { excellent: "text-success", good: "text-primary", fair: "text-warning", poor: "text-danger" };
const BAR: Record<HealthLevel, string> = { excellent: "bg-success", good: "bg-primary", fair: "bg-warning", poor: "bg-danger" };

const W = 180;
const H = 110;
const R = 70;
const CX = W / 2;
const CY = 95;
const HALF = Math.PI * R;

function arc(startAngle: number, endAngle: number): string {
  const point = (angle: number) => `${CX + R * Math.cos((angle * Math.PI) / 180)} ${CY + R * Math.sin((angle * Math.PI) / 180)}`;
  return `M ${point(startAngle)} A ${R} ${R} 0 0 1 ${point(endAngle)}`;
}

export function HealthScoreCard({ health }: { health: HealthScore | null }) {
  return (
    <Card aria-label="Salud financiera">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <HeartPulse className="size-4 text-muted-foreground" />
        <CardTitle className="text-base font-semibold">Salud financiera</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!health ? (
          <p className="text-sm text-muted-foreground">Registra ingresos y gastos para calcular tu puntaje.</p>
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Puntaje ${health.score} de 100, ${HEALTH_LEVEL_LABELS[health.level]}`} className="overflow-visible">
                <path d={arc(-180, 0)} fill="none" stroke="currentColor" className="text-muted" strokeWidth={12} strokeLinecap="round" />
                <path d={arc(-180, 0)} fill="none" stroke="currentColor" className={GAUGE[health.level]} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${(health.score / 100) * HALF} ${HALF}`} />
                <text x={CX} y={CY - 14} textAnchor="middle" className="fill-foreground text-4xl font-bold tabular-nums" fontSize={34} fontWeight={700}>
                  {health.score}
                </text>
                <text x={CX} y={CY + 4} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
                  {HEALTH_LEVEL_LABELS[health.level]}
                </text>
              </svg>
            </div>
            <ul className="space-y-2.5">
              {health.factors.map((factor) => {
                const Icon = ICONS[factor.key];
                return (
                  <li key={factor.key} className="flex items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="flex-1 text-sm">{HEALTH_LABELS[factor.key]}</span>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <span className={`block h-full rounded-full ${BAR[healthLevel(factor.score)]}`} style={{ width: `${factor.score}%` }} />
                    </span>
                    <span className="w-7 text-right text-xs font-semibold tabular-nums">{factor.score}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
