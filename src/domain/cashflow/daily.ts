import { addDays } from "@/domain/payPeriod/rules";
import type { FinancialStatusResult } from "@/domain/dashboard/rules";
import { daysInMonth } from "./rules";

export const DEFAULT_PROJECTION_DAYS = 60;
export const DAYS_PER_MONTH = 30;

export interface CashEvent {
  date: string;
  label: string;
  amountCents: number;
  source: "recurring" | "scheduled";
}

export interface RecurringForEvents {
  id?: number;
  name: string;
  dayOfMonth: number;
  estimatedAmountCents: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function sumEventsCents(events: Array<{ amountCents: number }>): number {
  return events.reduce((sum, e) => sum + e.amountCents, 0);
}

export function recurringEvents(items: RecurringForEvents[], fromExclusive: string, toInclusive: string, skip: Set<string> = new Set()): CashEvent[] {
  const events: CashEvent[] = [];
  let year = Number(fromExclusive.slice(0, 4));
  let month = Number(fromExclusive.slice(5, 7));
  const endKey = toInclusive.slice(0, 7);

  while (`${year}-${pad(month)}` <= endKey) {
    for (const item of items) {
      const date = `${year}-${pad(month)}-${pad(Math.min(item.dayOfMonth, daysInMonth(`${year}-${pad(month)}-01`)))}`;
      if (date <= fromExclusive || date > toInclusive) continue;
      if (item.id != null && skip.has(`${item.id}|${date}`)) continue;
      events.push({ date, label: item.name, amountCents: item.estimatedAmountCents, source: "recurring" });
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
}

export function variableDailyRateCents(avgMonthlyExpenseCents: number, recurringMonthlyExpenseCents: number): number {
  const variableMonthly = Math.min(0, avgMonthlyExpenseCents - recurringMonthlyExpenseCents);
  return variableMonthly / DAYS_PER_MONTH;
}

export interface DailyProjectionInput {
  startDate: string;
  startBalanceCents: number;
  days: number;
  events: CashEvent[];
  dailyVariableCents: number;
  minimumCents: number;
}

export interface DailyProjectionPoint {
  date: string;
  balanceCents: number;
}

export interface DailyProjection {
  series: DailyProjectionPoint[];
  endBalanceCents: number;
  events: CashEvent[];
  incomeCents: number;
  expensesCents: number;
  variableCents: number;
  lowest: DailyProjectionPoint;
  firstBelowMinimum: DailyProjectionPoint | null;
}

export function projectDailyBalance(input: DailyProjectionInput): DailyProjection {
  const endDate = addDays(input.startDate, input.days);
  const events = input.events.filter((e) => e.date > input.startDate && e.date <= endDate).sort((a, b) => a.date.localeCompare(b.date));

  const series: DailyProjectionPoint[] = [{ date: input.startDate, balanceCents: input.startBalanceCents }];
  let eventTotal = 0;
  for (let day = 1; day <= input.days; day++) {
    const date = addDays(input.startDate, day);
    eventTotal += events.filter((e) => e.date === date).reduce((sum, e) => sum + e.amountCents, 0);
    series.push({ date, balanceCents: input.startBalanceCents + eventTotal + Math.round(input.dailyVariableCents * day) });
  }

  const variableCents = Math.round(input.dailyVariableCents * input.days);
  return {
    series,
    endBalanceCents: series[series.length - 1].balanceCents,
    events,
    incomeCents: events.filter((e) => e.amountCents > 0).reduce((s, e) => s + e.amountCents, 0),
    expensesCents: events.filter((e) => e.amountCents < 0).reduce((s, e) => s + e.amountCents, 0),
    variableCents,
    lowest: series.reduce((low, p) => (p.balanceCents < low.balanceCents ? p : low), series[0]),
    firstBelowMinimum: series.slice(1).find((p) => p.balanceCents < input.minimumCents) ?? null,
  };
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const dateLabel = (iso: string) => `${Number(iso.slice(8, 10))} de ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
const pesos = (cents: number) => `${cents < 0 ? "−" : ""}$${Math.round(Math.abs(cents) / 100).toLocaleString("es-MX")}`;

export function cashProjectionStatus(projection: DailyProjection, minimumCents: number, days: number): FinancialStatusResult {
  if (projection.events.every((e) => e.amountCents <= 0)) {
    return {
      level: "yellow",
      message: "Esta proyección no incluye ingresos",
      detail: "No hay ingresos recurrentes ni programados registrados, así que solo ve salir dinero. Registra tu nómina como recurrente para que el aviso de saldo mínimo sea confiable.",
    };
  }
  if (projection.firstBelowMinimum) {
    return {
      level: "red",
      message: `Tu saldo proyectado cae por debajo de ${pesos(minimumCents)} el ${dateLabel(projection.firstBelowMinimum.date)}`,
      detail: `Ese día llegaría a ${pesos(projection.firstBelowMinimum.balanceCents)}.`,
    };
  }
  return {
    level: "green",
    message: `Tu saldo proyectado se mantiene por encima de ${pesos(minimumCents)} los próximos ${days} días`,
    detail: `Su punto más bajo sería ${pesos(projection.lowest.balanceCents)} el ${dateLabel(projection.lowest.date)}.`,
  };
}
