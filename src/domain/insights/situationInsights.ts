import { etaPhrase, type GoalProjection } from "@/domain/goals/projection";
import { Insight, MIN_NET_WORTH_CHANGE_CENTS, PRICE_INCREASE_MIN_CENTS, PRICE_INCREASE_MIN_PCT, RECURRING_LOOKBACK_DAYS, SAVINGS_RATE_SHIFT } from "./model";
import { daysBetween, pct, pesos } from "./format";
import { ROUTES } from "@/domain/shared/routes";

export function savingsInsights(input: { rate: number | null; previousRate: number | null; savedCents: number }): Insight[] {
  const insights: Insight[] = [];
  if (input.savedCents < 0) {
    insights.push({
      id: "savings-withdrawal",
      tone: "attention",
      message: `Retiraste ${pesos(input.savedCents)} de tus cuentas de ahorro en este periodo`,
      weight: Math.abs(input.savedCents),
    });
  }
  if (input.rate != null && input.previousRate != null) {
    const shift = input.rate - input.previousRate;
    if (shift <= -SAVINGS_RATE_SHIFT) {
      insights.push({ id: "savings-rate-down", tone: "attention", message: `Tu tasa de ahorro bajó de ${pct(input.previousRate)} a ${pct(input.rate)}`, weight: Math.abs(shift) * 100_000 });
    } else if (shift >= SAVINGS_RATE_SHIFT) {
      insights.push({ id: "savings-rate-up", tone: "positive", message: `Tu tasa de ahorro subió de ${pct(input.previousRate)} a ${pct(input.rate)}`, weight: shift * 100_000 });
    }
  }
  return insights;
}

export function netWorthInsight(deltaCents: number): Insight[] {
  if (Math.abs(deltaCents) < MIN_NET_WORTH_CHANGE_CENTS) return [];
  const up = deltaCents > 0;
  return [
    {
      id: "net-worth",
      tone: up ? "positive" : "change",
      message: `Tu patrimonio ${up ? "subió" : "bajó"} ${pesos(deltaCents)} frente al periodo anterior`,
      weight: Math.abs(deltaCents),
    },
  ];
}

export function uncategorizedInsight(input: { count: number; totalCents: number }): Insight[] {
  if (input.count <= 0) return [];
  return [
    {
      id: "uncategorized",
      tone: "attention",
      message: `Tienes ${input.count} ${input.count === 1 ? "gasto sin categoría" : "gastos sin categoría"}`,
      detail: `Suman ${pesos(input.totalCents)}: mientras no tengan categoría, las cifras por categoría quedan incompletas.`,
      href: ROUTES.transactions,
      weight: input.totalCents,
    },
  ];
}

export function suspectedTransfersInsight(count: number): Insight[] {
  if (count <= 0) return [];
  return [
    {
      id: "suspected-transfers",
      tone: "attention",
      message: `${count} ${count === 1 ? "movimiento parece" : "movimientos parecen"} una transferencia o un pago de tarjeta registrado como gasto o ingreso`,
      detail: "Mientras no los confirmes cuentan dos veces en tus gastos o ingresos.",
      href: ROUTES.transactions,
      weight: count,
    },
  ];
}

export interface InsightOccurrence {
  name: string;
  date: string;
  expectedAmountCents: number;
  actualAmountCents: number | null;
}

export function recurringPriceInsights(occurrences: InsightOccurrence[], today: string): Insight[] {
  const insights: Insight[] = [];
  for (const o of occurrences) {
    if (o.actualAmountCents == null || daysBetween(o.date, today) > RECURRING_LOOKBACK_DAYS) continue;
    const expected = Math.abs(o.expectedAmountCents);
    const diff = Math.abs(o.actualAmountCents) - expected;
    if (expected <= 0 || diff < PRICE_INCREASE_MIN_CENTS || diff / expected < PRICE_INCREASE_MIN_PCT) continue;
    insights.push({
      id: `price-${o.name}-${o.date}`,
      tone: "change",
      message: `Tu pago de ${o.name} fue ${pesos(diff)} superior a lo habitual`,
      detail: `Pagaste ${pesos(o.actualAmountCents)} y lo esperado era ${pesos(expected)}.`,
      weight: diff,
    });
  }
  return insights.sort((a, b) => b.weight - a.weight);
}

export interface InsightGoal {
  name: string;
  targetDate: string | null;
  projection: GoalProjection;
}

const pesosMonthly = (cents: number) => `${pesos(cents)} al mes`;

export function goalInsights(goals: InsightGoal[]): Insight[] {
  const insights: Insight[] = [];
  for (const goal of goals) {
    const p = goal.projection;
    if (p.achieved || p.etaDays == null) continue;
    if (p.onTrack === false && p.neededMonthlyCents != null) {
      insights.push({
        id: `goal-off-track-${goal.name}`,
        tone: "attention",
        message: `Al ritmo actual tu meta “${goal.name}” no llega a su fecha objetivo`,
        detail: `Ahorras ${pesosMonthly(p.monthlyPaceCents)} y para llegar a tiempo harían falta ${pesosMonthly(p.neededMonthlyCents)}.`,
        href: ROUTES.goals,
        weight: p.neededMonthlyCents - p.monthlyPaceCents,
      });
    } else {
      insights.push({
        id: `goal-eta-${goal.name}`,
        tone: "goal",
        message: `Al ritmo actual alcanzarías tu meta “${goal.name}” en ${etaPhrase(p.etaDays)}`,
        detail: `Estás ahorrando ${pesosMonthly(p.monthlyPaceCents)} para esta meta.`,
        href: ROUTES.goals,
        weight: -p.etaDays,
      });
    }
  }
  return insights;
}
