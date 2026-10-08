import { PERIOD_START_DAY, dayOfMonthOf, findPeriodIndexContaining, nextOccurrenceOnOrAfter, shiftMonthIso, type PeriodRange } from "@/domain/payPeriod/rules";
import { groupPeriodsByMonth } from "@/domain/payPeriod/periodView";

export const PAYROLL_NAME = "Nómina";
export const PAYROLL_FREQUENCIES = ["biweekly", "monthly"] as const;
export type PayrollFrequency = (typeof PAYROLL_FREQUENCIES)[number];
export const PAYROLL_MODES = ["sync", "manual"] as const;
export type PayrollMode = (typeof PAYROLL_MODES)[number];

export const PAYROLL_FREQUENCY_LABELS: Record<PayrollFrequency, string> = { biweekly: "Quincenal", monthly: "Mensual" };
export const PAYROLL_MODE_LABELS: Record<PayrollMode, string> = { sync: "Según mis periodos de pago", manual: "Elegir los días yo" };

export class InvalidPayrollError extends Error {}

export interface PayrollPlanItem {
  name: string;
  dayOfMonth: number;
}

export interface PayrollPlanInput {
  frequency: PayrollFrequency;
  mode: PayrollMode;
  manualDays: number[];
  periods: PeriodRange[];
  today: string;
}

export const paydayCount = (frequency: PayrollFrequency): number => (frequency === "biweekly" ? 2 : 1);

export function payrollNames(frequency: PayrollFrequency): string[] {
  return frequency === "monthly" ? [PAYROLL_NAME] : [`${PAYROLL_NAME} · 1ª quincena`, `${PAYROLL_NAME} · 2ª quincena`];
}

export function isPayrollItem(item: { name: string; flow: string }): boolean {
  return item.flow === "income" && item.name.startsWith(PAYROLL_NAME);
}

export function paydaysFromPeriods(periods: PeriodRange[], today: string, frequency: PayrollFrequency): number[] {
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  if (sorted.length === 0) return [];
  const containing = findPeriodIndexContaining(sorted, today);
  const reference = containing >= 0 ? containing : Math.max(0, sorted.filter((period) => period.start <= today).length - 1);
  const month = groupPeriodsByMonth(sorted).find((group) => group.periods.some((period) => period.start === sorted[reference].start));
  const first = month?.periods[0] ?? sorted[reference];
  const startDays = [dayOfMonthOf(first.start)];
  if (frequency === "biweekly") {
    const next = sorted[sorted.findIndex((period) => period.start === first.start) + 1];
    if (next) startDays.push(dayOfMonthOf(next.start));
  }
  return startDays;
}

function assertValidDays(days: number[], frequency: PayrollFrequency): void {
  if (days.length !== paydayCount(frequency)) throw new InvalidPayrollError(`la nómina ${PAYROLL_FREQUENCY_LABELS[frequency].toLowerCase()} necesita ${paydayCount(frequency)} día(s) de cobro`);
  if (days.some((day) => !Number.isInteger(day) || day < 1 || day > 31)) throw new InvalidPayrollError("el día de cobro debe estar entre 1 y 31");
  if (new Set(days).size !== days.length) throw new InvalidPayrollError("los días de cobro no pueden repetirse");
}

export function buildPayrollPlan({ frequency, mode, manualDays, periods, today }: PayrollPlanInput): PayrollPlanItem[] {
  if (mode === "sync") {
    if (frequency !== "biweekly") throw new InvalidPayrollError("la nómina mensual necesita que elijas el día de cobro");
    if (upcomingPeriodStarts(periods, today, 1).length === 0) throw new InvalidPayrollError("no hay periodos de pago por delante para sincronizar la nómina");
    return [{ name: PAYROLL_NAME, dayOfMonth: PERIOD_START_DAY }];
  }
  assertValidDays(manualDays, frequency);
  const names = payrollNames(frequency);
  return [...manualDays].sort((a, b) => a - b).map((dayOfMonth, index) => ({ name: names[index], dayOfMonth }));
}

export function upcomingPeriodStarts(periods: PeriodRange[], today: string, count: number): string[] {
  return periods
    .map((period) => period.start)
    .filter((start) => start >= today)
    .sort()
    .slice(0, count);
}

export function suggestedMonthlyDay(periods: PeriodRange[], today: string): number | null {
  return paydaysFromPeriods(periods, today, "monthly")[0] ?? null;
}

export interface PayrollSetup {
  frequency: PayrollFrequency;
  mode: PayrollMode;
  days: number[];
  amountCents: number;
  accountId: number | null;
}

export function inferPayrollSetup(items: Array<{ name: string; flow: string; estimatedAmountCents: number; dayOfMonth: number; accountId: number | null; status: string }>): PayrollSetup | null {
  const payroll = items.filter((item) => isPayrollItem(item) && item.status === "active").sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  if (payroll.length === 0) return null;
  const synced = payroll.find((item) => item.dayOfMonth === PERIOD_START_DAY);
  if (synced) return { frequency: "biweekly", mode: "sync", days: [], amountCents: Math.abs(synced.estimatedAmountCents), accountId: synced.accountId };
  const frequency: PayrollFrequency = payroll.length >= 2 ? "biweekly" : "monthly";
  const used = payroll.slice(0, paydayCount(frequency));
  return { frequency, mode: "manual", days: used.map((item) => item.dayOfMonth), amountCents: Math.abs(used[0].estimatedAmountCents), accountId: used[0].accountId };
}

export function upcomingPaydays(days: number[], today: string, count: number): string[] {
  const valid = days.filter((day) => Number.isInteger(day) && day >= 1 && day <= 31);
  if (valid.length === 0 || count <= 0) return [];
  const dates = new Set<string>();
  let cursor = today;
  for (let guard = 0; guard < 24 && dates.size < count + valid.length; guard++) {
    for (const day of valid) dates.add(nextOccurrenceOnOrAfter(day, cursor));
    cursor = `${shiftMonthIso(cursor.slice(0, 7), 1)}-01`;
  }
  return [...dates].sort().slice(0, count);
}

export interface PayrollSchedule {
  frequency: PayrollFrequency;
  mode: PayrollMode;
  days: number[];
}

export function upcomingPayrollDates(schedule: PayrollSchedule, periods: PeriodRange[], today: string, count: number): string[] {
  if (schedule.mode === "sync") return upcomingPeriodStarts(periods, today, count);
  return upcomingPaydays(schedule.days, today, count);
}
