import type { DebtsRepository } from "@/domain/debts/ports";
import {
  describePayoff,
  monthlyInterestCents,
  nextDueDate,
  parseDebtTerms,
  projectPayoff,
  type DebtTerms,
  type PayoffProjection,
} from "@/domain/debts/rules";
import { addDays } from "@/domain/payPeriod/rules";

const PAYMENT_WINDOW_DAYS = 90;
const INTEREST_WINDOW_DAYS = 365;
const MONTHS_IN_PAYMENT_WINDOW = PAYMENT_WINDOW_DAYS / 30;

export interface DebtPayoffView {
  label: string;
  monthlyPaymentCents: number;
  projection: PayoffProjection;
  message: string | null;
}

export interface DebtAccountOverview {
  id: number;
  name: string;
  owedCents: number;
  terms: DebtTerms;
  monthlyInterestCents: number | null;
  nextDueDate: string | null;
  avgMonthlyPaymentCents: number;
  interestPaid12mCents: number;
  payoffs: DebtPayoffView[];
}

export class GetDebtOverviewUseCase {
  constructor(private readonly repo: DebtsRepository) {}

  async execute(familyId: number, today: string): Promise<DebtAccountOverview[]> {
    const accounts = await this.repo.listLiabilityAccounts(familyId, today);
    const stats = await this.repo.getMovementStats(accounts.map((a) => a.id), addDays(today, -PAYMENT_WINDOW_DAYS), addDays(today, -INTEREST_WINDOW_DAYS), today);

    return accounts.map((account) => {
      const owedCents = Math.max(0, -account.balanceCents);
      const terms = parseDebtTerms(account.details);
      const movement = stats.get(account.id) ?? { paymentsCents: 0, interestCents: 0 };
      const avgMonthlyPaymentCents = Math.round(movement.paymentsCents / MONTHS_IN_PAYMENT_WINDOW);

      const candidates: Array<{ label: string; monthlyPaymentCents: number | null }> = [
        { label: "tu pago habitual", monthlyPaymentCents: avgMonthlyPaymentCents > 0 ? avgMonthlyPaymentCents : null },
        { label: "el pago mínimo", monthlyPaymentCents: terms.minimumPaymentCents },
      ];
      const payoffs: DebtPayoffView[] = candidates.flatMap((c) => {
        if (c.monthlyPaymentCents == null || c.monthlyPaymentCents <= 0 || owedCents === 0) return [];
        const projection = projectPayoff({ owedCents, annualRatePct: terms.annualRatePct, monthlyPaymentCents: c.monthlyPaymentCents, today });
        return [{ label: c.label, monthlyPaymentCents: c.monthlyPaymentCents, projection, message: describePayoff(projection, c.label, c.monthlyPaymentCents) }];
      });

      return {
        id: account.id,
        name: account.name,
        owedCents,
        terms,
        monthlyInterestCents: monthlyInterestCents(owedCents, terms.annualRatePct),
        nextDueDate: nextDueDate(today, terms.paymentDueDay),
        avgMonthlyPaymentCents,
        interestPaid12mCents: movement.interestCents,
        payoffs,
      };
    }).sort((a, b) => b.owedCents - a.owedCents);
  }
}
