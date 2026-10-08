import { daysInMonth, endOfMonth } from "@/domain/cashflow/rules";

export interface PeriodRange {
  start: string;
  end: string;
}

const WEEKDAY_SUNDAY = 0;
const WEEKDAY_SATURDAY = 6;

export function isBusinessDay(isoDate: string): boolean {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday !== WEEKDAY_SUNDAY && weekday !== WEEKDAY_SATURDAY;
}

export function addDays(isoDate: string, delta: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function previousBusinessDayBefore(isoDate: string): string {
  let candidate = addDays(isoDate, -1);
  while (!isBusinessDay(candidate)) {
    candidate = addDays(candidate, -1);
  }
  return candidate;
}

export function defaultPayDate(nominalDate: string): string {
  return previousBusinessDayBefore(nominalDate);
}

export function shiftMonthIso(monthIso: string, delta: number): string {
  const [year, month] = monthIso.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nominalPayDatesForMonth(monthIso: string): [string, string] {
  return [`${monthIso}-15`, endOfMonth(`${monthIso}-01`)];
}

function defaultPayDateSequence(centerMonthIso: string, marginMonths: number): string[] {
  const dates: string[] = [];
  for (let m = -marginMonths; m <= marginMonths; m++) {
    const monthIso = shiftMonthIso(centerMonthIso, m);
    const [mid, end] = nominalPayDatesForMonth(monthIso);
    dates.push(defaultPayDate(mid), defaultPayDate(end));
  }
  return [...new Set(dates)].sort();
}

export function generateSuggestedPeriods(fromDate: string, count: number): PeriodRange[] {
  const marginMonths = Math.ceil(count / 2) + 2;
  const sequence = defaultPayDateSequence(fromDate.slice(0, 7), marginMonths);
  const startIdx = sequence.findIndex((d) => d >= fromDate);
  const relevant = sequence.slice(startIdx === -1 ? 0 : startIdx);
  const periods: PeriodRange[] = [];
  for (let i = 0; i < count && i + 1 < relevant.length; i++) {
    periods.push({ start: relevant[i], end: addDays(relevant[i + 1], -1) });
  }
  return periods;
}

export function findPeriodIndexContaining<T extends PeriodRange>(periods: T[], date: string): number {
  return periods.findIndex((p) => p.start <= date && date <= p.end);
}

export function rangeFromPeriods<T extends PeriodRange>(periods: T[]): PeriodRange {
  const starts = periods.map((p) => p.start);
  const ends = periods.map((p) => p.end);
  return { start: starts.reduce((a, b) => (a < b ? a : b)), end: ends.reduce((a, b) => (a > b ? a : b)) };
}

export function periodLengthDays(period: PeriodRange): number {
  return daysBetweenInclusive(period.start, period.end);
}

export function daysBetweenInclusive(fromIso: string, toIso: string): number {
  const from = Date.UTC(...splitIso(fromIso));
  const to = Date.UTC(...splitIso(toIso));
  return Math.round((to - from) / 86_400_000) + 1;
}

function splitIso(isoDate: string): [number, number, number] {
  const [year, month, day] = isoDate.split("-").map(Number);
  return [year, month - 1, day];
}

export function periodLabel(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
  const [sy, sm, sd] = splitIso(start);
  const [ey, em, ed] = splitIso(end);
  const startLabel = fmt.format(new Date(Date.UTC(sy, sm, sd)));
  const endLabel = fmt.format(new Date(Date.UTC(ey, em, ed)));
  return `${startLabel} – ${endLabel}`;
}

export const PERIOD_START_DAY = 0;

export function resolveDayOfMonthWithinRange(dayOfMonth: number, rangeStart: string, rangeEnd: string): string | null {
  if (dayOfMonth === PERIOD_START_DAY) return rangeStart;
  const months = new Set([rangeStart.slice(0, 7), rangeEnd.slice(0, 7)]);
  for (const monthIso of months) {
    const clampedDay = Math.min(dayOfMonth, daysInMonth(`${monthIso}-01`));
    const candidate = `${monthIso}-${String(clampedDay).padStart(2, "0")}`;
    if (candidate >= rangeStart && candidate <= rangeEnd) return candidate;
  }
  return null;
}

export function nextOccurrenceOnOrAfter(dayOfMonth: number, referenceDate: string): string {
  const monthIso = referenceDate.slice(0, 7);
  const clampedDay = Math.min(dayOfMonth, daysInMonth(`${monthIso}-01`));
  const candidate = `${monthIso}-${String(clampedDay).padStart(2, "0")}`;
  if (candidate >= referenceDate) return candidate;

  const nextMonthIso = shiftMonthIso(monthIso, 1);
  const clampedDayNext = Math.min(dayOfMonth, daysInMonth(`${nextMonthIso}-01`));
  return `${nextMonthIso}-${String(clampedDayNext).padStart(2, "0")}`;
}

export function findOverlappingPeriod<T extends PeriodRange & { id: number }>(periods: T[], candidate: PeriodRange, ignoreId?: number): T | undefined {
  return periods.find((p) => p.id !== ignoreId && p.start <= candidate.end && candidate.start <= p.end);
}

export function dayOfMonthOf(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

export const DEFAULT_PERIOD_LENGTH_DAYS = 15;

export function nextPeriodDefaults(lastPeriodEnd: string | null, today: string): PeriodRange {
  const start = lastPeriodEnd ? addDays(lastPeriodEnd, 1) : today;
  return { start, end: addDays(start, DEFAULT_PERIOD_LENGTH_DAYS - 1) };
}
