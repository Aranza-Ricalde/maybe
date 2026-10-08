import assert from "node:assert/strict";
import { test } from "node:test";
import { computePeriodFigures, type PeriodFiguresInput } from "./periodFigures";

const account = (accountId: number, balanceCents: number) => ({ accountId, name: `c${accountId}`, type: "checking" as const, balanceCents });

const INPUT: PeriodFiguresInput = {
  flow: { incomeCents: 2_000_000, expenseCents: -500_000 },
  priorFlow: { incomeCents: 1_800_000, expenseCents: -600_000 },
  savingsAccounts: [account(2, 1_300_000)],
  assetAccounts: [account(1, 400_000), account(2, 1_300_000)],
  liabilityAccounts: [account(3, -300_000)],
  creditCardAccounts: [{ ...account(3, -300_000), creditLimitCents: 1_000_000 }],
  earliestLiabilityBalancesCents: [-600_000],
  debtPaymentsCents: 50_000,
  debtAtPeriodStartCents: -400_000,
  assetsAtPreviousEndCents: 1_500_000,
  savingsTransfersCents: 150_000,
  previousSavingsTransfersCents: 90_000,
  savingsAtPeriodStartCents: 1_000_000,
  savingsBeforePreviousPeriodCents: 900_000,
  openingsAfterPreviousEndCents: 100_000,
  openingsAfterBeforePreviousCents: 100_000,
  daysElapsed: 8,
  daysInPeriod: 15,
  budgetedTotalCents: null,
};

test("computePeriodFigures: deuda, ahorro, flujo y patrimonio salen de las mismas reglas que antes", () => {
  const figures = computePeriodFigures(INPUT);
  assert.deepEqual(figures.debt, { totalCents: -300_000, paidThisPeriodCents: 50_000, overallPercentPaid: 0.5 });
  assert.equal(figures.savingsRate.savedCents, 150_000);
  assert.equal(figures.savingsRate.yieldCents, 50_000);
  assert.equal(figures.savingsRate.rate, 0.075);
  assert.equal(figures.savingsRate.previousRate, 90_000 / 1_800_000);
  assert.deepEqual(figures.flow, { incomeCents: 2_000_000, expenseCents: -500_000, debtPaymentCents: -50_000, savingsCents: -150_000, remainingCents: 1_300_000 });
  assert.equal(figures.wealth.netWorthCents, 1_700_000 - 300_000);
  assert.equal(figures.totalBalanceCents, 1_700_000);
  assert.equal(figures.creditCards[0].availableCreditCents, 700_000);
});
