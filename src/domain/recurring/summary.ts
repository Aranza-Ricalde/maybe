import { PERIOD_START_DAY } from "@/domain/payPeriod/rules";

export const PERIODS_PER_MONTH = 2;

export interface RecurringSummaryInput {
  dayOfMonth?: number;
  flow: "income" | "expense";
  estimatedAmountCents: number;
  status: "active" | "paused";
}

export interface RecurringSummary {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  activeCount: number;
}

export function summarizeRecurring(items: RecurringSummaryInput[]): RecurringSummary {
  let incomeCents = 0;
  let expenseCents = 0;
  let activeCount = 0;
  for (const item of items) {
    if (item.status !== "active") continue;
    activeCount++;
    const monthly = Math.abs(item.estimatedAmountCents) * (item.dayOfMonth === PERIOD_START_DAY ? PERIODS_PER_MONTH : 1);
    if (item.flow === "income") incomeCents += monthly;
    else expenseCents += monthly;
  }
  return { incomeCents, expenseCents, netCents: incomeCents - expenseCents, activeCount };
}
