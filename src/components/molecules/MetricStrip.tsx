import { ArrowDownLeft, ArrowUpRight, CalendarClock, CreditCard, Gauge, LineChart, PiggyBank, ShieldCheck, Target, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { InfoTooltip } from "@/components/molecules/InfoTooltip";
import { cn } from "@/lib/utils";

export type MetricTone = "default" | "success" | "danger";

export interface Metric {
  key: string;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: MetricTone;
  tooltip?: string;
}

const ICON_BY_KEY: Record<string, LucideIcon> = {
  spent: ArrowUpRight,
  expense: ArrowUpRight,
  income: ArrowDownLeft,
  saved: PiggyBank,
  contributed: PiggyBank,
  yield: TrendingUp,
  net: PiggyBank,
  left: CalendarClock,
  average: Gauge,
  assets: Wallet,
  now: Wallet,
  debts: CreditCard,
  budgeted: Target,
  change: TrendingUp,
  projected: LineChart,
  minimum: ShieldCheck,
};

const TILE_TONE: Record<MetricTone, { icon: string; value: string }> = {
  default: { icon: "bg-muted text-muted-foreground", value: "text-foreground" },
  success: { icon: "bg-success/10 text-success", value: "text-success" },
  danger: { icon: "bg-danger/10 text-danger", value: "text-danger" },
};

const COLUMNS: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3 max-sm:[&>*:first-child]:col-span-2", 4: "grid-cols-2 xl:grid-cols-4", 5: "grid-cols-2 xl:grid-cols-6" };

export function MetricStrip({ metrics, leading, stacked = false, className }: { metrics: Metric[]; leading?: ReactNode; stacked?: boolean; className?: string }) {
  const count = metrics.length + (leading ? 1 : 0);
  return (
    <dl className={cn("grid gap-3", stacked ? "grid-cols-2 lg:grid-cols-1" : (COLUMNS[count] ?? "sm:grid-cols-3"), className)}>
      {leading}
      {metrics.map((metric) => {
        const Icon = ICON_BY_KEY[metric.key];
        const tone = TILE_TONE[metric.tone ?? "default"];
        return (
          <div key={metric.key} className="flex min-w-0 flex-col items-start gap-2 rounded-xl bg-card p-3 sm:flex-row sm:items-center sm:gap-3 ring-1 ring-foreground/10">
            {Icon && (
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tone.icon)}>
                <Icon className="size-4" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                {metric.label}
                {metric.tooltip && <InfoTooltip label={metric.tooltip} />}
              </dt>
              <dd className={cn("truncate text-lg font-semibold tracking-tight tabular-nums", tone.value)}>{metric.value}</dd>
              {metric.hint && <dd className="text-xs text-muted-foreground">{metric.hint}</dd>}
            </div>
          </div>
        );
      })}
    </dl>
  );
}
