import { PERIOD_START_DAY } from "@/domain/payPeriod/rules";

export function recurringDetailLabel(accountName: string | undefined, categoryName: string | undefined): string {
  const parts = [accountName, categoryName].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : "Sin cuenta ni categoría";
}

export const RECURRING_BUCKETS = ["Esta semana", "Este mes", "Próximo mes", "Cada periodo"] as const;
export type RecurringBucket = (typeof RECURRING_BUCKETS)[number];

const daysInMonth = (isoDate: string) => new Date(Date.UTC(Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7)), 0)).getUTCDate();

export function daysUntilNext(dayOfMonth: number, today: string): number {
  const todayDay = Number(today.slice(8, 10));
  return dayOfMonth >= todayDay ? dayOfMonth - todayDay : daysInMonth(today) - todayDay + dayOfMonth;
}

export function recurringBucket(dayOfMonth: number, today: string): RecurringBucket {
  if (dayOfMonth === PERIOD_START_DAY) return "Cada periodo";
  if (daysUntilNext(dayOfMonth, today) <= 7) return "Esta semana";
  return dayOfMonth >= Number(today.slice(8, 10)) ? "Este mes" : "Próximo mes";
}

export function sortByNextOccurrence<T extends { dayOfMonth: number }>(rows: T[], today: string): T[] {
  const weight = (row: T) => (row.dayOfMonth === PERIOD_START_DAY ? Number.MAX_SAFE_INTEGER : daysUntilNext(row.dayOfMonth, today));
  return [...rows].sort((a, b) => weight(a) - weight(b));
}
