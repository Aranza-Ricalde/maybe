import { DEBT_PAYMENT_DAYS_AFTER, DEBT_PAYMENT_DAYS_BEFORE, debtDueEntries } from "@/domain/calendar/debts";
import type { CalendarEntry } from "@/domain/calendar/rules";
import type { DebtsRepository } from "@/domain/debts/ports";
import { parseDebtTerms } from "@/domain/debts/rules";
import { addDays } from "@/domain/payPeriod/rules";

export class GetDebtCalendarUseCase {
  constructor(private readonly repo: DebtsRepository) {}

  async execute(familyId: number, today: string, periodStart: string, periodEnd: string): Promise<CalendarEntry[]> {
    const accounts = await this.repo.listLiabilityAccounts(familyId, today);
    const debts = accounts.map((a) => {
      const terms = parseDebtTerms(a.details);
      return { accountId: a.id, name: a.name, owedCents: Math.max(0, -a.balanceCents), minimumPaymentCents: terms.minimumPaymentCents, paymentDueDay: terms.paymentDueDay };
    });
    if (!debts.some((d) => d.minimumPaymentCents != null && d.paymentDueDay != null)) return [];

    const payments = await this.repo.listPayments(debts.map((d) => d.accountId), addDays(periodStart, -DEBT_PAYMENT_DAYS_BEFORE), addDays(periodEnd, DEBT_PAYMENT_DAYS_AFTER));
    return debtDueEntries(debts, payments, today, periodStart, periodEnd);
  }
}
