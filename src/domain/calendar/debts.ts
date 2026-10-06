import { recurringEvents } from "@/domain/cashflow/daily";
import { addDays } from "@/domain/payPeriod/rules";
import type { CalendarEntry } from "./rules";

export const DEBT_PAYMENT_DAYS_BEFORE = 20;
export const DEBT_PAYMENT_DAYS_AFTER = 5;

export interface CalendarDebtInput {
  accountId: number;
  name: string;
  owedCents: number;
  minimumPaymentCents: number | null;
  paymentDueDay: number | null;
}

export interface CalendarDebtPayment {
  accountId: number;
  date: string;
  amountCents: number;
  name: string;
}

export function debtDueEntries(
  debts: CalendarDebtInput[],
  payments: CalendarDebtPayment[],
  today: string,
  periodStart: string,
  periodEnd: string,
): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  for (const debt of debts) {
    if (debt.owedCents <= 0 || debt.minimumPaymentCents == null || debt.minimumPaymentCents <= 0 || debt.paymentDueDay == null) continue;
    const dues = recurringEvents([{ name: debt.name, dayOfMonth: debt.paymentDueDay, estimatedAmountCents: -debt.minimumPaymentCents }], addDays(periodStart, -1), periodEnd);

    for (const due of dues) {
      const windowStart = addDays(due.date, -DEBT_PAYMENT_DAYS_BEFORE);
      const windowEnd = addDays(due.date, DEBT_PAYMENT_DAYS_AFTER);
      const covering = payments.filter((p) => p.accountId === debt.accountId && p.amountCents > 0 && p.date >= windowStart && p.date <= windowEnd);
      const paidCents = covering.reduce((sum, p) => sum + p.amountCents, 0);
      const covered = paidCents >= debt.minimumPaymentCents;
      const biggest = covering.reduce<CalendarDebtPayment | null>((best, p) => (best == null || p.amountCents > best.amountCents ? p : best), null);

      entries.push({
        occurrenceId: null,
        name: `Pago mínimo · ${debt.name}`,
        flow: "expense",
        source: "deuda",
        expectedDate: due.date,
        expectedAmountCents: due.amountCents,
        status: covered ? "paid" : due.date < today ? "overdue" : "pending",
        isManual: false,
        actualName: covered ? (biggest?.name ?? null) : null,
        actualDate: covered ? (biggest?.date ?? null) : null,
        actualAmountCents: covered ? paidCents : null,
      });
    }
  }
  return entries.sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
}
