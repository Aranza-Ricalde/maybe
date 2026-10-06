import { debtProgress, type DebtProgressResult } from "./rules";

export interface DebtSummaryInput {
  liabilityBalancesCents: number[];
  earliestLiabilityBalancesCents: number[];
}

export interface DebtSummary extends DebtProgressResult {
  totalCents: number;
}

export function summarizeDebt(input: DebtSummaryInput): DebtSummary {
  const totalCents = input.liabilityBalancesCents.reduce((sum, b) => sum + b, 0);
  const owedNow = input.liabilityBalancesCents.reduce((sum, b) => sum + Math.max(0, -b), 0);
  const owedAtStart = input.earliestLiabilityBalancesCents.reduce((sum, b) => sum + Math.max(0, -b), 0);
  return { totalCents, ...debtProgress(owedNow, owedAtStart) };
}

export interface SavingsContributionInput {
  savingsNowCents: number;
  savingsAtPeriodStartCents: number;
  savingsBeforePreviousPeriodCents: number;
  openingBalancesAfterPreviousEndCents: number;
  openingBalancesAfterBeforePreviousCents: number;
}

export interface SavingsContribution {
  contributedCents: number;
  previousContributedCents: number;
}

export function savingsContribution(input: SavingsContributionInput): SavingsContribution {
  const openedDuringPreviousPeriod = input.openingBalancesAfterBeforePreviousCents - input.openingBalancesAfterPreviousEndCents;
  return {
    contributedCents: input.savingsNowCents - input.savingsAtPeriodStartCents - input.openingBalancesAfterPreviousEndCents,
    previousContributedCents: input.savingsAtPeriodStartCents - input.savingsBeforePreviousPeriodCents - openedDuringPreviousPeriod,
  };
}

export function remainingAfterFlow(input: { incomeCents: number; expenseCents: number; savingsCents: number; debtPaymentsCents: number }): number {
  return input.incomeCents + input.expenseCents - input.savingsCents - input.debtPaymentsCents;
}
