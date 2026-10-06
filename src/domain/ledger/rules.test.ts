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

test("affectsAggregateTotals excluye transferencias y ajustes de saldo; solo standard es ingreso/gasto", () => {
  assert.equal(affectsAggregateTotals("standard"), true);
  assert.equal(affectsAggregateTotals("adjustment"), false);
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

import {
  InvalidTransactionError as InvalidTxError,
  TRANSACTION_KINDS,
  TRANSACTION_SOURCES,
  TRANSACTION_STATUSES,
  VALUATION_SOURCES,
  assertValidTransactionKind,
  assertValidTransactionSource,
  assertValidTransactionStatus,
} from "./rules";

test("assertValidTransactionKind: acepta los kinds conocidos y rechaza otros (la base ya no los valida)", () => {
  for (const kind of TRANSACTION_KINDS) assert.doesNotThrow(() => assertValidTransactionKind(kind));
  assert.throws(() => assertValidTransactionKind("inventado"), InvalidTxError);
  assert.throws(() => assertValidTransactionKind(""), InvalidTxError);
});

test("assertValidTransactionStatus y Source: aceptan los conocidos y rechazan otros", () => {
  for (const s of TRANSACTION_STATUSES) assert.doesNotThrow(() => assertValidTransactionStatus(s));
  for (const s of TRANSACTION_SOURCES) assert.doesNotThrow(() => assertValidTransactionSource(s));
  assert.throws(() => assertValidTransactionStatus("borrado"), InvalidTxError);
  assert.throws(() => assertValidTransactionSource("api_externa"), InvalidTxError);
  assert.deepEqual([...VALUATION_SOURCES], ["manual", "csv_import"]);
});

import { parseTransactionDrilldown } from "./rules";

test("parseTransactionDrilldown: acepta categoría y rango válidos", () => {
  assert.deepEqual(parseTransactionDrilldown({ categoryId: "43", from: "2026-09-01", to: "2026-09-30" }), { categoryId: 43, from: "2026-09-01", to: "2026-09-30" });
});

test("parseTransactionDrilldown: descarta todo lo inválido (nunca confía en la URL)", () => {
  assert.deepEqual(parseTransactionDrilldown({ categoryId: "43; drop table", from: "ayer", to: "2026-09-30" }), {});
  assert.deepEqual(parseTransactionDrilldown({ categoryId: "-3" }), {});
  assert.deepEqual(parseTransactionDrilldown({}), {});
});

test("parseTransactionDrilldown: un rango a medias o invertido no se usa", () => {
  assert.deepEqual(parseTransactionDrilldown({ from: "2026-09-01" }), {});
  assert.deepEqual(parseTransactionDrilldown({ from: "2026-10-01", to: "2026-09-01" }), {});
});

import { parseTransactionKindGroup } from "./rules";

test("parseTransactionKindGroup: solo acepta los grupos conocidos (nunca confía en lo que llegue)", () => {
  assert.equal(parseTransactionKindGroup("standard"), "standard");
  assert.equal(parseTransactionKindGroup("transfers"), "transfers");
  assert.equal(parseTransactionKindGroup(""), undefined);
  assert.equal(parseTransactionKindGroup("cualquier cosa"), undefined);
  assert.equal(parseTransactionKindGroup(undefined), undefined);
});

import { NON_FLOW_KINDS } from "./rules";

test("un ajuste de saldo mueve saldo pero no cuenta como ingreso ni gasto", () => {
  assert.equal(affectsAggregateTotals("adjustment"), false);
  assert.equal(affectsAggregateTotals("standard"), true);
  assert.deepEqual([...NON_FLOW_KINDS].sort(), ["adjustment", "cc_payment", "loan_payment", "transfer"]);
});

import { assertValidTransactionName, MAX_AMOUNT_CENTS } from "./rules";

test("límites de entrada: monto máximo, nombre largo y fechas inexistentes se rechazan", () => {
  assert.throws(() => assertValidAmountCents(MAX_AMOUNT_CENTS + 1));
  assert.doesNotThrow(() => assertValidAmountCents(-MAX_AMOUNT_CENTS));
  assert.throws(() => assertValidTransactionName("x".repeat(201)));
  assert.doesNotThrow(() => assertValidTransactionName("tacos"));
  assert.throws(() => assertValidIsoDate("2026-13-45"));
  assert.throws(() => assertValidIsoDate("2026-02-30"));
  assert.doesNotThrow(() => assertValidIsoDate("2026-02-28"));
});
