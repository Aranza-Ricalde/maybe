import assert from "node:assert/strict";
import { test } from "node:test";
import { remainingAfterFlow, savingsContribution, summarizeDebt } from "./summary";

test("summarizeDebt: un saldo a favor no cuenta como deuda ni resta progreso", () => {
  const summary = summarizeDebt({ liabilityBalancesCents: [-3_300_000, -591_310], earliestLiabilityBalancesCents: [-3_300_000, 527_185] });
  assert.equal(summary.totalCents, -3_891_310);
  assert.equal(summary.paidCents, 0);
  assert.equal(summary.percentPaid, 0);
});

test("summarizeDebt: pagos que bajan la deuda dan porcentaje", () => {
  const summary = summarizeDebt({ liabilityBalancesCents: [-600_000], earliestLiabilityBalancesCents: [-1_000_000] });
  assert.equal(summary.percentPaid, 0.4);
});

test("savingsContribution: descuenta el saldo inicial de cuentas abiertas dentro del periodo", () => {
  const result = savingsContribution({
    savingsNowCents: 10_187_258,
    savingsAtPeriodStartCents: 10_111_236,
    savingsBeforePreviousPeriodCents: 10_000_000,
    openingBalancesAfterPreviousEndCents: 50_505,
    openingBalancesAfterBeforePreviousCents: 50_505,
  });
  assert.equal(result.contributedCents, 10_187_258 - 10_111_236 - 50_505);
  assert.equal(result.previousContributedCents, 111_236);
});

test("remainingAfterFlow: ingreso + gasto − ahorro − pagos de deuda", () => {
  assert.equal(remainingAfterFlow({ incomeCents: 2_058_252, expenseCents: -221_885, savingsCents: 26_017, debtPaymentsCents: 0 }), 1_810_350);
});
