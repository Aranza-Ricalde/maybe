import type { PeriodRange } from "./rules";

export const PERIOD_VIEWS = ["biweekly", "monthly"] as const;
export type PeriodView = (typeof PERIOD_VIEWS)[number];

export const DEFAULT_PERIOD_VIEW: PeriodView = "monthly";

export const PERIOD_VIEW_LABELS: Record<PeriodView, string> = { biweekly: "Quincenal", monthly: "Mensual" };

export class InvalidPeriodViewError extends Error {}

export function assertValidPeriodView(value: string): asserts value is PeriodView {
  if (!PERIOD_VIEWS.includes(value as PeriodView)) throw new InvalidPeriodViewError(`Vista de periodos inválida: "${value}".`);
}

export function normalizePeriodView(raw: string | null | undefined): PeriodView {
  return PERIOD_VIEWS.includes(raw as PeriodView) ? (raw as PeriodView) : DEFAULT_PERIOD_VIEW;
}

export interface PeriodMonth<T extends PeriodRange> {
  key: string;
  periods: T[];
}

export const monthKeyOf = (period: PeriodRange): string => period.end.slice(0, 7);

export function groupPeriodsByMonth<T extends PeriodRange>(periods: T[]): PeriodMonth<T>[] {
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  const months: PeriodMonth<T>[] = [];
  for (const period of sorted) {
    const key = monthKeyOf(period);
    const last = months.at(-1);
    if (last && last.key === key) last.periods.push(period);
    else months.push({ key, periods: [period] });
  }
  return months;
}

export const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] as const;

export function monthName(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const name = MONTH_NAMES[month - 1] ?? key;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export interface MonthShareInput extends PeriodRange {
  id: number;
}

export function withMonthShare<T extends MonthShareInput>(allPeriods: T[], selected: T[]): Array<T & { monthShare: number }> {
  const countByMonth = new Map(groupPeriodsByMonth(allPeriods).map((month) => [month.key, month.periods.length]));
  return selected.map((period) => ({ ...period, monthShare: 1 / (countByMonth.get(monthKeyOf(period)) ?? 1) }));
}

export interface PayPeriodResize {
  id: number;
  start: string;
  end: string;
}

export type PayMonthPlan = { updates: PayPeriodResize[] } | { error: string };

export function planMonthResize<T extends MonthShareInput>(allPeriods: T[], memberId: number, start: string, end: string): PayMonthPlan {
  const months = groupPeriodsByMonth(allPeriods);
  const monthIndex = months.findIndex((month) => month.periods.some((period) => period.id === memberId));
  if (monthIndex < 0) return { error: "el mes no existe" };
  const { periods } = months[monthIndex];
  const first = periods[0];
  const last = periods[periods.length - 1];
  if (start > end) return { error: "la fecha de inicio debe ser anterior o igual a la fecha de fin" };
  if (start > first.end || end < last.start) return { error: "el mes no puede dejar fuera a sus quincenas: ajusta primero la quincena que quedaría vacía" };
  const sorted = [...allPeriods].sort((a, b) => a.start.localeCompare(b.start));
  const firstIndex = sorted.findIndex((period) => period.id === first.id);
  const previous = sorted[firstIndex - 1];
  const next = sorted[firstIndex + periods.length];
  if (previous && start <= previous.end) return { error: "el inicio se traslapa con el periodo anterior: un mismo día no puede pertenecer a dos periodos" };
  if (next && end >= next.start) return { error: "el fin se traslapa con el periodo siguiente: un mismo día no puede pertenecer a dos periodos" };
  const updates: PayPeriodResize[] = [];
  if (first.id === last.id) {
    if (start !== first.start || end !== first.end) updates.push({ id: first.id, start, end });
  } else {
    if (start !== first.start) updates.push({ id: first.id, start, end: first.end });
    if (end !== last.end) updates.push({ id: last.id, start: last.start, end });
  }
  return { updates };
}
