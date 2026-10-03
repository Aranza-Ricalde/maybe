import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InvalidTransactionError,
  affectsAggregateTotals,
  assertValidAmountCents,
  assertValidIsoDate,
  classifyFlow,
  monthStart,
} from "./rules";

test("affectsAggregateTotals excluye los 3 kinds de transfer, incluye standard y adjustment", () => {
  assert.equal(affectsAggregateTotals("standard"), true);
  assert.equal(affectsAggregateTotals("adjustment"), true);
  assert.equal(affectsAggregateTotals("transfer"), false);
  assert.equal(affectsAggregateTotals("loan_payment"), false);
  assert.equal(affectsAggregateTotals("cc_payment"), false);
});

test("classifyFlow: positivo o cero es income, negativo es expense", () => {
  assert.equal(classifyFlow(1), "income");
  assert.equal(classifyFlow(0), "income");
  assert.equal(classifyFlow(-1), "expense");
});

test("monthStart trunca al primer día del mes", () => {
  assert.equal(monthStart("2026-03-15"), "2026-03-01");
  assert.equal(monthStart("2026-01-01"), "2026-01-01");
  assert.equal(monthStart("2026-12-31"), "2026-12-01");
});

test("assertValidAmountCents rechaza 0 y no-enteros, acepta enteros distintos de 0", () => {
  assert.throws(() => assertValidAmountCents(0), InvalidTransactionError);
  assert.throws(() => assertValidAmountCents(10.5), InvalidTransactionError);
  assert.throws(() => assertValidAmountCents(Number.NaN), InvalidTransactionError);
  assert.doesNotThrow(() => assertValidAmountCents(1));
  assert.doesNotThrow(() => assertValidAmountCents(-15000));
});

test("assertValidIsoDate exige YYYY-MM-DD exacto", () => {
  assert.doesNotThrow(() => assertValidIsoDate("2026-03-15"));
  assert.throws(() => assertValidIsoDate("2026/03/15"), InvalidTransactionError);
  assert.throws(() => assertValidIsoDate("15-03-2026"), InvalidTransactionError);
  assert.throws(() => assertValidIsoDate(""), InvalidTransactionError);
  assert.throws(() => assertValidIsoDate("2026-3-15"), InvalidTransactionError);
});
