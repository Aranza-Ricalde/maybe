import { PERIOD_START_DAY } from "@/domain/payPeriod/rules";
export const SCHEDULED_TRANSACTION_STATUSES = ["planned", "confirmed", "cancelled"] as const;
export type ScheduledTransactionStatus = (typeof SCHEDULED_TRANSACTION_STATUSES)[number];

export interface RecurringItemForProjection {
  id?: number;
  name: string;
  dayOfMonth: number;
  estimatedAmountCents: number;
}

export interface ScheduledForProjection {
  name: string;
  scheduledDate: string;
  amountCents: number;
}

export interface CashflowProjectionInput {
  asOfDate: string;
  currentBalanceCents: number;
  activeRecurringItems: RecurringItemForProjection[];
  plannedScheduled: ScheduledForProjection[];
  recentMonthlyExpenseCents: number[];
  periodStartsRemaining?: string[];
}

export interface CashflowProjection {
  asOfDate: string;
  currentBalanceCents: number;
  remainingRecurringCents: number;
  remainingScheduledCents: number;
  projectedVariableSpendCents: number;
  projectedEndOfMonthBalanceCents: number;
}

export function daysInMonth(isoDate: string): number {
  const [year, month] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function dayOfMonthOf(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

export function endOfMonth(isoDate: string): string {
  const total = daysInMonth(isoDate);
  return `${isoDate.slice(0, 7)}-${String(total).padStart(2, "0")}`;
}

const AVG_DAYS_PER_MONTH = 30;

export function computeCashflowProjection(input: CashflowProjectionInput): CashflowProjection {
  const today = dayOfMonthOf(input.asOfDate);
  const lastDay = daysInMonth(input.asOfDate);

  const anchoredCount = (input.periodStartsRemaining ?? []).length;
  const remainingRecurringCents = input.activeRecurringItems
    .filter((item) => item.dayOfMonth > today && item.dayOfMonth <= lastDay)
    .reduce((sum, item) => sum + item.estimatedAmountCents, 0) +
    input.activeRecurringItems.filter((item) => item.dayOfMonth === PERIOD_START_DAY).reduce((sum, item) => sum + item.estimatedAmountCents * anchoredCount, 0);

  const remainingScheduledCents = input.plannedScheduled.reduce((sum, s) => sum + s.amountCents, 0);

  const avgMonthlyExpenseCents =
    input.recentMonthlyExpenseCents.length > 0
      ? Math.round(input.recentMonthlyExpenseCents.reduce((a, b) => a + b, 0) / input.recentMonthlyExpenseCents.length)
      : 0;
  const recurringMonthlyExpenseCents = input.activeRecurringItems
    .filter((item) => item.estimatedAmountCents < 0)
    .reduce((sum, item) => sum + item.estimatedAmountCents, 0);
  const variableMonthlyExpenseCents = Math.min(0, avgMonthlyExpenseCents - recurringMonthlyExpenseCents);

  const remainingDays = Math.max(0, lastDay - today);
  const dailyVariableRateCents = variableMonthlyExpenseCents / AVG_DAYS_PER_MONTH;
  const projectedVariableSpendCents = Math.round(dailyVariableRateCents * remainingDays);

  const projectedEndOfMonthBalanceCents =
    input.currentBalanceCents + remainingRecurringCents + remainingScheduledCents + projectedVariableSpendCents;

  return {
    asOfDate: input.asOfDate,
    currentBalanceCents: input.currentBalanceCents,
    remainingRecurringCents,
    remainingScheduledCents,
    projectedVariableSpendCents,
    projectedEndOfMonthBalanceCents,
  };
}
