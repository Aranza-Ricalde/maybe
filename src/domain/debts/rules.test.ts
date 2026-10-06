import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidDebtTermsError, assertValidDebtTerms, mergeDebtTerms, monthlyInterestCents, nextDueDate, parseDebtTerms, projectPayoff } from "./rules";

const NONE = { annualRatePct: null, minimumPaymentCents: null, paymentDueDay: null };

test("lee las condiciones de la cuenta y deja en null lo que falta o no es número", () => {
  assert.deepEqual(parseDebtTerms({ annualRatePct: 45, minimumPaymentCents: 150_000, paymentDueDay: 12, creditLimitCents: 5_000_000 }), { annualRatePct: 45, minimumPaymentCents: 150_000, paymentDueDay: 12 });
  assert.deepEqual(parseDebtTerms(null), NONE);
  assert.deepEqual(parseDebtTerms({ annualRatePct: "45", paymentDueDay: NaN }), NONE);
});

test("guardar condiciones no pisa el límite de crédito; null borra el dato y deja la cuenta limpia", () => {
  const merged = mergeDebtTerms({ creditLimitCents: 5_000_000 }, { annualRatePct: 45, minimumPaymentCents: null, paymentDueDay: 12 });
  assert.deepEqual(merged, { creditLimitCents: 5_000_000, annualRatePct: 45, paymentDueDay: 12 });
  assert.deepEqual(mergeDebtTerms(merged, { annualRatePct: null, minimumPaymentCents: null, paymentDueDay: null }), { creditLimitCents: 5_000_000 });
  assert.equal(mergeDebtTerms({ annualRatePct: 10 }, NONE), null);
});

test("rechaza tasas, pagos y días imposibles", () => {
  for (const bad of [{ ...NONE, annualRatePct: -1 }, { ...NONE, annualRatePct: 301 }, { ...NONE, minimumPaymentCents: -5 }, { ...NONE, minimumPaymentCents: 10.5 }, { ...NONE, paymentDueDay: 0 }, { ...NONE, paymentDueDay: 32 }, { ...NONE, paymentDueDay: 1.5 }]) {
    assert.throws(() => assertValidDebtTerms(bad), InvalidDebtTermsError);
  }
  assert.doesNotThrow(() => assertValidDebtTerms({ annualRatePct: 0, minimumPaymentCents: 0, paymentDueDay: 31 }));
});

test("el interés mensual es la tasa anual entre 12 sobre lo que se debe, y sin tasa no se inventa", () => {
  assert.equal(monthlyInterestCents(10_000_000, 36), 300_000);
  assert.equal(monthlyInterestCents(10_000_000, 0), 0);
  assert.equal(monthlyInterestCents(10_000_000, null), null);
  assert.equal(monthlyInterestCents(-5, 36), 0);
});

test("la próxima fecha de pago: este mes si aún no pasa (hoy cuenta), si no el siguiente; día 31 en mes corto cae el último", () => {
  assert.equal(nextDueDate("2026-10-06", 12), "2026-10-12");
  assert.equal(nextDueDate("2026-10-12", 12), "2026-10-12");
  assert.equal(nextDueDate("2026-10-13", 12), "2026-11-12");
  assert.equal(nextDueDate("2026-11-05", 31), "2026-11-30");
  assert.equal(nextDueDate("2026-12-20", 5), "2027-01-05");
  assert.equal(nextDueDate("2026-10-06", null), null);
});

test("sin interés, liquidar es deuda entre pago", () => {
  const p = projectPayoff({ owedCents: 3_000_000, annualRatePct: null, monthlyPaymentCents: 500_000, today: "2026-10-06" });
  assert.equal(p.status, "payoff");
  assert.equal(p.months, 6);
  assert.equal(p.totalInterestCents, 0);
  assert.equal(p.payoffDate, "2027-04-06");
});

test("con interés tarda más y se paga interés; un pago mayor liquida antes", () => {
  const slow = projectPayoff({ owedCents: 10_000_000, annualRatePct: 36, monthlyPaymentCents: 500_000, today: "2026-10-06" });
  const fast = projectPayoff({ owedCents: 10_000_000, annualRatePct: 36, monthlyPaymentCents: 1_000_000, today: "2026-10-06" });
  assert.equal(slow.status, "payoff");
  assert.ok((slow.months as number) > 20);
  assert.ok(slow.totalInterestCents > 0);
  assert.ok((fast.months as number) < (slow.months as number));
  assert.ok(fast.totalInterestCents < slow.totalInterestCents);
});

test("si el pago no cubre ni el interés, la deuda no baja: 'never'", () => {
  assert.equal(projectPayoff({ owedCents: 10_000_000, annualRatePct: 36, monthlyPaymentCents: 300_000, today: "2026-10-06" }).status, "never");
  assert.equal(projectPayoff({ owedCents: 10_000_000, annualRatePct: 36, monthlyPaymentCents: 100_000, today: "2026-10-06" }).status, "never");
});

test("deuda en cero y sin pago de referencia", () => {
  assert.equal(projectPayoff({ owedCents: 0, annualRatePct: 36, monthlyPaymentCents: 100, today: "2026-10-06" }).status, "paid");
  assert.equal(projectPayoff({ owedCents: 5_000, annualRatePct: null, monthlyPaymentCents: null, today: "2026-10-06" }).status, "no_payment");
  assert.equal(projectPayoff({ owedCents: 5_000, annualRatePct: null, monthlyPaymentCents: 0, today: "2026-10-06" }).status, "no_payment");
});
