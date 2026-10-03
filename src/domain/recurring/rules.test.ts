import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertValidDayOfMonth,
  assertValidEstimatedAmount,
  assertValidRecurringItemName,
  detectRecurringGroups,
  InvalidRecurringItemError,
  patternSignatureFor,
  signedEstimatedAmountCents,
  type TransactionForDetection,
} from "./rules";

test("assertValidRecurringItemName: rechaza nombre vacío", () => {
  assert.throws(() => assertValidRecurringItemName(""), InvalidRecurringItemError);
  assert.throws(() => assertValidRecurringItemName("  "), InvalidRecurringItemError);
});

test("assertValidEstimatedAmount: rechaza 0, negativo o no finito", () => {
  assert.throws(() => assertValidEstimatedAmount(0), InvalidRecurringItemError);
  assert.throws(() => assertValidEstimatedAmount(-10), InvalidRecurringItemError);
  assert.throws(() => assertValidEstimatedAmount(Number.NaN), InvalidRecurringItemError);
});

test("assertValidDayOfMonth: rechaza fuera de 1-31 o no entero", () => {
  assert.throws(() => assertValidDayOfMonth(0), InvalidRecurringItemError);
  assert.throws(() => assertValidDayOfMonth(32), InvalidRecurringItemError);
  assert.throws(() => assertValidDayOfMonth(15.5), InvalidRecurringItemError);
});

test("assertValidDayOfMonth: acepta 1 a 31", () => {
  assert.doesNotThrow(() => assertValidDayOfMonth(1));
  assert.doesNotThrow(() => assertValidDayOfMonth(31));
});

test("signedEstimatedAmountCents: income se queda positivo, expense se vuelve negativo", () => {
  assert.equal(signedEstimatedAmountCents("income", 50_000), 50_000);
  assert.equal(signedEstimatedAmountCents("expense", 50_000), -50_000);
});

test("patternSignatureFor usa el merchant si existe, si no el nombre normalizado", () => {
  assert.equal(
    patternSignatureFor({ accountId: 1, merchantId: 42, name: "no importa" }),
    "account:1|merchant:42",
  );
  assert.equal(
    patternSignatureFor({ accountId: 1, merchantId: null, name: "NETFLIX.COM 8832" }),
    "account:1|name:netflix com",
  );
});

test("patternSignatureFor normaliza folios numéricos distintos al mismo patrón", () => {
  const a = patternSignatureFor({ accountId: 7, merchantId: null, name: "SP *UBER *TRIP 883219 MEXICO CITY MX" });
  const b = patternSignatureFor({ accountId: 7, merchantId: null, name: "SP *UBER *TRIP 991044 MEXICO CITY MX" });
  assert.equal(a, b);
});

function tx(partial: Partial<TransactionForDetection> & { date: string; amountCents: number }): TransactionForDetection {
  return { accountId: 1, categoryId: null, merchantId: null, name: "Netflix", ...partial };
}

test("detectRecurringGroups: menos de 3 ocurrencias no cuenta como recurrente", () => {
  const txs = [tx({ date: "2026-04-05", amountCents: -15000 }), tx({ date: "2026-05-05", amountCents: -15000 })];
  assert.deepEqual(detectRecurringGroups(txs), []);
});

test("detectRecurringGroups: 3+ ocurrencias pero en el MISMO mes no cuenta (exige ≥3 meses distintos)", () => {
  const txs = [
    tx({ date: "2026-05-01", amountCents: -15000 }),
    tx({ date: "2026-05-10", amountCents: -15000 }),
    tx({ date: "2026-05-20", amountCents: -15000 }),
  ];
  assert.deepEqual(detectRecurringGroups(txs), []);
});

test("detectRecurringGroups: detecta un patrón real (4 meses, monto y día estables)", () => {
  const txs = [
    tx({ date: "2026-03-05", amountCents: -15000 }),
    tx({ date: "2026-04-06", amountCents: -15000 }),
    tx({ date: "2026-05-04", amountCents: -15500 }),
    tx({ date: "2026-06-05", amountCents: -15000 }),
  ];
  const [group] = detectRecurringGroups(txs);
  assert.ok(group, "debió detectar un grupo");
  assert.equal(group.flow, "expense");
  assert.equal(group.occurrences, 4);
  assert.equal(group.suggestedAmountCents, Math.round((-15000 - 15000 - 15500 - 15000) / 4));
});

test("detectRecurringGroups: rechaza si el monto varía más del 10% de tolerancia", () => {
  const txs = [
    tx({ date: "2026-03-05", amountCents: -10000 }),
    tx({ date: "2026-04-05", amountCents: -10000 }),
    tx({ date: "2026-05-05", amountCents: -50000 }),
  ];
  assert.deepEqual(detectRecurringGroups(txs), []);
});

test("detectRecurringGroups: rechaza si el día del mes varía más de la tolerancia (5 días)", () => {
  const txs = [
    tx({ date: "2026-03-01", amountCents: -10000 }),
    tx({ date: "2026-04-20", amountCents: -10000 }),
    tx({ date: "2026-05-01", amountCents: -10000 }),
  ];
  assert.deepEqual(detectRecurringGroups(txs), []);
});

test("detectRecurringGroups: una compra única (ruido) no se mezcla con el patrón recurrente", () => {
  const recurring = [
    tx({ date: "2026-03-05", amountCents: -15000 }),
    tx({ date: "2026-04-05", amountCents: -15000 }),
    tx({ date: "2026-05-05", amountCents: -15000 }),
  ];
  const noise = tx({ date: "2026-04-20", amountCents: -120000, name: "Muebles del Norte" });
  const groups = detectRecurringGroups([...recurring, noise]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].occurrences, 3);
});

test("detectRecurringGroups: ingreso recurrente (nómina) se clasifica como income", () => {
  const txs = [
    tx({ date: "2026-03-15", amountCents: 2_000_000, name: "Nómina" }),
    tx({ date: "2026-04-15", amountCents: 2_000_000, name: "Nómina" }),
    tx({ date: "2026-05-15", amountCents: 2_000_000, name: "Nómina" }),
  ];
  const [group] = detectRecurringGroups(txs);
  assert.equal(group.flow, "income");
});

test("detectRecurringGroups: la categoría sugerida es la de la ocurrencia más reciente", () => {
  const txs = [
    tx({ date: "2026-03-05", amountCents: -15000, categoryId: 1 }),
    tx({ date: "2026-04-05", amountCents: -15000, categoryId: 1 }),
    tx({ date: "2026-05-05", amountCents: -15000, categoryId: 2 }),
  ];
  const [group] = detectRecurringGroups(txs);
  assert.equal(group.suggestedCategoryId, 2);
});

test("detectRecurringGroups: cuentas distintas con el mismo nombre no se mezclan", () => {
  const txs = [
    tx({ date: "2026-03-05", amountCents: -15000, accountId: 1 }),
    tx({ date: "2026-04-05", amountCents: -15000, accountId: 1 }),
    tx({ date: "2026-05-05", amountCents: -15000, accountId: 1 }),
    tx({ date: "2026-03-06", amountCents: -9000, accountId: 2 }),
    tx({ date: "2026-04-06", amountCents: -9000, accountId: 2 }),
  ];
  const groups = detectRecurringGroups(txs);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].accountId, 1);
});
