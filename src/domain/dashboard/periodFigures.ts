import { type NetWorthChange, netWorthChange, netWorthCents, savingsRate } from "@/domain/wealth/rules";
import type { AccountBalance, CreditCardAccount, MonthlyFlow } from "./ports";
import { creditCardSummary, financialStatus, type FinancialStatusResult } from "./rules";
import { remainingAfterFlow, savingsContribution, summarizeDebt } from "./summary";

const sumBalances = (accounts: AccountBalance[]) => accounts.reduce((sum, account) => sum + account.balanceCents, 0);

export interface PeriodFiguresInput {
  flow: MonthlyFlow;
  priorFlow: MonthlyFlow;
  savingsAccounts: AccountBalance[];
  assetAccounts: AccountBalance[];
  liabilityAccounts: AccountBalance[];
  creditCardAccounts: CreditCardAccount[];
  earliestLiabilityBalancesCents: number[];
  debtPaymentsCents: number;
  debtAtPeriodStartCents: number;
  assetsAtPreviousEndCents: number;
  savingsAtPeriodStartCents: number;
  savingsBeforePreviousPeriodCents: number;
  openingsAfterPreviousEndCents: number;
  openingsAfterBeforePreviousCents: number;
  daysElapsed: number;
  daysInPeriod: number;
  budgetedTotalCents: number | null;
}

export interface PeriodFigures {
  totalBalanceCents: number;
  savingsTotalCents: number;
  debt: { totalCents: number; paidThisPeriodCents: number; overallPercentPaid: number };
  creditCards: Array<CreditCardAccount & { availableCreditCents: number | null }>;
  flow: { incomeCents: number; expenseCents: number; debtPaymentCents: number; savingsCents: number; remainingCents: number };
  financialStatus: FinancialStatusResult;
  wealth: { netWorthCents: number; assetsCents: number; liabilitiesCents: number; change: NetWorthChange };
  savingsRate: { rate: number | null; savedCents: number; incomeCents: number; previousRate: number | null };
}

export function computePeriodFigures(input: PeriodFiguresInput): PeriodFigures {
  const { flow, priorFlow, debtPaymentsCents } = input;
  const debt = summarizeDebt({ liabilityBalancesCents: input.liabilityAccounts.map((a) => a.balanceCents), earliestLiabilityBalancesCents: input.earliestLiabilityBalancesCents });
  const savings = savingsContribution({
    savingsNowCents: sumBalances(input.savingsAccounts),
    savingsAtPeriodStartCents: input.savingsAtPeriodStartCents,
    savingsBeforePreviousPeriodCents: input.savingsBeforePreviousPeriodCents,
    openingBalancesAfterPreviousEndCents: input.openingsAfterPreviousEndCents,
    openingBalancesAfterBeforePreviousCents: input.openingsAfterBeforePreviousCents,
  });

  const assetsCents = sumBalances(input.assetAccounts);
  const liabilitiesCents = sumBalances(input.liabilityAccounts);
  const currentNetWorthCents = netWorthCents({ assetsCents, liabilitiesCents });
  const previousNetWorthCents = netWorthCents({ assetsCents: input.assetsAtPreviousEndCents, liabilitiesCents: input.debtAtPeriodStartCents });

  return {
    totalBalanceCents: assetsCents,
    savingsTotalCents: sumBalances(input.savingsAccounts),
    debt: { totalCents: debt.totalCents, paidThisPeriodCents: debtPaymentsCents, overallPercentPaid: debt.percentPaid },
    creditCards: input.creditCardAccounts.map((card) => ({
      ...card,
      availableCreditCents: card.creditLimitCents != null ? creditCardSummary(card.creditLimitCents, Math.abs(card.balanceCents)).availableCents : null,
    })),
    flow: {
      incomeCents: flow.incomeCents,
      expenseCents: flow.expenseCents,
      debtPaymentCents: -debtPaymentsCents,
      savingsCents: -savings.contributedCents,
      remainingCents: remainingAfterFlow({ incomeCents: flow.incomeCents, expenseCents: flow.expenseCents, savingsCents: savings.contributedCents, debtPaymentsCents }),
    },
    financialStatus: financialStatus({
      incomeCentsThisPeriod: flow.incomeCents,
      expenseCentsThisPeriod: flow.expenseCents,
      incomeCentsPriorPeriod: priorFlow.incomeCents,
      expenseCentsPriorPeriod: priorFlow.expenseCents,
      daysElapsedInPeriod: input.daysElapsed,
      daysInPeriod: input.daysInPeriod,
      budgetedTotalCents: input.budgetedTotalCents,
    }),
    wealth: { netWorthCents: currentNetWorthCents, assetsCents, liabilitiesCents, change: netWorthChange(currentNetWorthCents, previousNetWorthCents) },
    savingsRate: {
      rate: savingsRate({ incomeCents: flow.incomeCents, savedCents: savings.contributedCents }),
      savedCents: savings.contributedCents,
      incomeCents: flow.incomeCents,
      previousRate: savingsRate({ incomeCents: priorFlow.incomeCents, savedCents: savings.previousContributedCents }),
    },
  };
}
