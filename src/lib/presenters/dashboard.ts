import type { DashboardSummary } from "@/application/getDashboardSummary";
import type { SpendingPace } from "@/domain/dashboard/pace";
import { formatPercent, formatPesos, formatShortDate, formatSignedPesos, formatCurrency } from "@/lib/format";
import type { MetricView, StatsChartModel } from "./stats";

export interface HeroAmount {
  whole: string;
  cents: string;
  negative: boolean;
}

export function splitHeroAmount(totalCents: number): HeroAmount {
  const magnitude = Math.abs(totalCents);
  const whole = Math.floor(magnitude / 100);
  return { whole: `$${whole.toLocaleString("es-MX")}`, cents: `.${String(magnitude % 100).padStart(2, "0")}`, negative: totalCents < 0 };
}

export function buildPaceChart(pace: SpendingPace): StatsChartModel {
  const lastActual = pace.days.filter((day) => day.spentCents != null).at(-1);
  return {
    kind: "lines",
    data: pace.days.map((day) => ({ label: formatShortDate(day.date), date: day.date, spent: day.spentCents, pace: day.paceCents })),
    series: [
      { key: "spent", label: "Gastado", color: "var(--foreground)" },
      { key: "pace", label: "Ritmo esperado", color: "var(--muted-foreground)", dashed: true },
    ],
    references: pace.budgetCents > 0 ? [{ label: `Presupuesto ${formatPesos(pace.budgetCents)}`, value: pace.budgetCents, tone: "muted" }] : [],
    marker: lastActual ? formatShortDate(lastActual.date) : null,
  };
}

export interface PaceNotice {
  tone: "danger" | "warning" | "success" | "muted";
  text: string;
}

export function paceNotice(pace: SpendingPace): PaceNotice {
  if (pace.status === "no_budget") return { tone: "muted", text: "Aún no tienes presupuesto para este periodo; crea uno para ver tu ritmo de gasto." };
  if (pace.status === "over") return { tone: "danger", text: `Ya superaste tu presupuesto por ${formatPesos(pace.spentCents - pace.budgetCents)}${pace.daysRemaining > 0 ? ` y quedan ${pace.daysRemaining} días` : ""}.` };
  if (pace.status === "ahead") return { tone: "warning", text: `Llevas ${formatPesos(pace.spentCents)}, más de lo esperado a hoy (${formatPesos(pace.expectedTodayCents)}). Si sigues así podrías pasarte de tu presupuesto.` };
  return { tone: "success", text: `Vas dentro de tu presupuesto: llevas ${formatPesos(pace.spentCents)} de ${formatPesos(pace.budgetCents)}.` };
}

export function buildDashboardMetrics(pace: SpendingPace | null, period: { incomeCents: number; expenseCents: number }, savingsRate: DashboardSummary["savingsRate"]): MetricView[] {
  const spent = pace?.spentCents ?? period.expenseCents;
  const budgetShare = pace && pace.budgetCents > 0 ? `${formatPercent(spent / pace.budgetCents)} del presupuesto` : undefined;
  const daysLeft = pace ? `${pace.daysRemaining} ${pace.daysRemaining === 1 ? "día" : "días"} restantes` : undefined;
  return [
    { key: "spent", label: "Gastado", value: formatPesos(spent), hint: [budgetShare, daysLeft].filter(Boolean).join(" · ") || undefined, tone: pace?.status === "over" ? "danger" : "default" },
    { key: "income", label: "Ingresos", value: formatPesos(period.incomeCents), tone: "default" },
    { key: "contributed", label: "Aportaste a ahorro", value: formatSignedPesos(savingsRate.savedCents), hint: savingsRate.rate != null ? `${formatPercent(savingsRate.rate)} de tus ingresos` : "Traspasos a tus cuentas de ahorro", tone: savingsRate.savedCents >= 0 ? "default" : "danger" },
    { key: "yield", label: "Rendimientos", value: `${savingsRate.yieldCents > 0 ? "+" : savingsRate.yieldCents < 0 ? "−" : ""}${formatCurrency(Math.abs(savingsRate.yieldCents))}`, hint: "Intereses y otros cambios de saldo", tone: savingsRate.yieldCents >= 0 ? "success" : "danger" },
  ];
}

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;

export function weekdayLabel(isoDate: string): string {
  return WEEKDAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()];
}

export function movementChartData(days: Array<{ date: string; incomeCents: number; expenseCents: number }>): Array<{ label: string; moneyIn: number; moneyOut: number }> {
  return days.map((day) => ({ label: weekdayLabel(day.date), moneyIn: day.incomeCents, moneyOut: day.expenseCents }));
}

export const HEALTH_LABELS = { savings: "Ahorro", spending: "Gasto vs presupuesto", debt: "Deuda", emergency: "Fondo de emergencia", bills: "Pagos al corriente" } as const;
export const HEALTH_LEVEL_LABELS = { excellent: "Excelente", good: "Bien", fair: "Regular", poor: "Atención" } as const;

export interface SpendingLimitView {
  budgetCents: number;
  spentCents: number;
  remainingCents: number;
  barValue: number;
  over: boolean;
}

export function spendingLimitView(pace: { budgetCents: number; spentCents: number } | null): SpendingLimitView {
  const budgetCents = pace?.budgetCents ?? 0;
  const spentCents = pace?.spentCents ?? 0;
  return {
    budgetCents,
    spentCents,
    remainingCents: budgetCents - spentCents,
    barValue: budgetCents > 0 ? Math.max(0, Math.min(100, (spentCents / budgetCents) * 100)) : 0,
    over: spentCents > budgetCents,
  };
}

export function movementTotals(days: Array<{ incomeCents: number; expenseCents: number }>): { inCents: number; outCents: number; netCents: number } {
  const inCents = days.reduce((sum, day) => sum + day.incomeCents, 0);
  const outCents = days.reduce((sum, day) => sum + day.expenseCents, 0);
  return { inCents, outCents, netCents: inCents - outCents };
}
