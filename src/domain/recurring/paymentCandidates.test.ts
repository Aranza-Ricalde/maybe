import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidOccurrenceLinkError, assertOccurrenceCanBeLinked, rankPaymentCandidates } from "./paymentCandidates";

const target = { expectedDate: "2026-10-10", expectedAmountCents: 50_000, flow: "expense" as const };
const tx = (id: number, date: string, amountCents: number) => ({ id, date, amountCents, name: `m${id}` });

test("ordena por monto más parecido y luego por cercanía de fecha", () => {
  const ranked = rankPaymentCandidates(target, [tx(1, "2026-10-10", -60_000), tx(2, "2026-10-13", -50_000), tx(3, "2026-10-11", -50_000)]);
  assert.deepEqual(ranked.map((t) => t.id), [3, 2, 1]);
  assert.equal(ranked[0].daysApart, 1);
  assert.equal(ranked[2].amountDiffCents, 10_000);
});

test("descarta movimientos de otro sentido o fuera de la ventana", () => {
  const ranked = rankPaymentCandidates(target, [tx(1, "2026-10-10", 50_000), tx(2, "2026-11-20", -50_000), tx(3, "2026-09-25", -50_000), tx(4, "2026-09-24", -50_000)]);
  assert.deepEqual(ranked.map((t) => t.id), [3]);
});

test("un ingreso busca solo ingresos", () => {
  const income = { expectedDate: "2026-10-15", expectedAmountCents: 100_000, flow: "income" as const };
  assert.deepEqual(rankPaymentCandidates(income, [tx(1, "2026-10-15", 100_000), tx(2, "2026-10-15", -100_000)]).map((t) => t.id), [1]);
});

test("respeta el límite de opciones", () => {
  const many = Array.from({ length: 10 }, (_, i) => tx(i + 1, "2026-10-10", -50_000));
  assert.equal(rankPaymentCandidates(target, many, 3).length, 3);
});

test("solo se puede ligar una ocurrencia abierta o pagada a mano sin movimiento", () => {
  assert.doesNotThrow(() => assertOccurrenceCanBeLinked({ status: "pending", transactionId: null }));
  assert.doesNotThrow(() => assertOccurrenceCanBeLinked({ status: "paid", transactionId: null }));
  assert.throws(() => assertOccurrenceCanBeLinked({ status: "paid", transactionId: 5 }), InvalidOccurrenceLinkError);
  assert.throws(() => assertOccurrenceCanBeLinked({ status: "skipped", transactionId: null }), InvalidOccurrenceLinkError);
});
