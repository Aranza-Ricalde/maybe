import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isEmptyOccurrenceSyncPlan,
  planOccurrenceSync,
  type OccurrenceSyncInput,
  type RecurringItemForOccurrences,
  type StoredOccurrence,
  type TransactionForOccurrences,
} from "./occurrences";

const START = "2026-09-29";
const END = "2026-10-14";

function item(overrides: Partial<RecurringItemForOccurrences> = {}): RecurringItemForOccurrences {
  return {
    id: 1,
    status: "active",
    flow: "expense",
    dayOfMonth: 2,
    estimatedAmountCents: -49900,
    conceptId: 7,
    categoryId: 43,
    providerId: 14,
    accountId: 1,
    ...overrides,
  };
}

function tx(overrides: Partial<TransactionForOccurrences> = {}): TransactionForOccurrences {
  return { id: 100, date: "2026-10-02", amountCents: -49900, accountId: 1, categoryId: 43, conceptId: null, providerId: null, ...overrides };
}

function stored(overrides: Partial<StoredOccurrence> = {}): StoredOccurrence {
  return { id: 500, recurringItemId: 1, expectedDate: "2026-10-02", expectedAmountCents: -49900, status: "pending", transactionId: null, matchSource: null, ...overrides };
}

function plan(overrides: Partial<OccurrenceSyncInput> = {}) {
  return planOccurrenceSync({ items: [item()], existing: [], transactions: [], periodStart: START, periodEnd: END, ...overrides });
}

test("crea una ocurrencia pendiente por recurrente activo cuando no hay movimientos", () => {
  const p = plan();
  assert.equal(p.toCreate.length, 1);
  assert.deepEqual(
    { ...p.toCreate[0] },
    { recurringItemId: 1, expectedDate: "2026-10-02", expectedAmountCents: -49900, status: "pending", transactionId: null, matchSource: null, matchScore: null },
  );
});

test("un recurrente pausado, o cuyo día no cae en el periodo, no genera ocurrencia", () => {
  assert.equal(plan({ items: [item({ status: "paused" })] }).toCreate.length, 0);
  assert.equal(plan({ items: [item({ dayOfMonth: 20 })] }).toCreate.length, 0);
});

test("liga por concepto explícito: ocurrencia pagada, origen auto y score 100", () => {
  const p = plan({ transactions: [tx({ conceptId: 7 })] });
  assert.equal(p.toCreate[0].status, "paid");
  assert.equal(p.toCreate[0].transactionId, 100);
  assert.equal(p.toCreate[0].matchSource, "auto");
  assert.equal(p.toCreate[0].matchScore, 100);
});

test("principios #38: pagar desde OTRA cuenta distinta de la habitual sigue siendo el mismo recurrente", () => {
  const p = plan({ transactions: [tx({ conceptId: 7, accountId: 2 })] });
  assert.equal(p.toCreate.length, 1);
  assert.equal(p.toCreate[0].status, "paid");
});

test("liga por señal fuerte (proveedor + monto + categoría) sin concepto asignado", () => {
  const p = plan({ transactions: [tx({ providerId: 14 })] });
  assert.equal(p.toCreate[0].status, "paid");
  assert.ok((p.toCreate[0].matchScore ?? 0) >= 70);
});

test("regla de oro #34: sin proveedor ni concepto no se adivina, queda pendiente", () => {
  const p = plan({ transactions: [tx()] });
  assert.equal(p.toCreate[0].status, "pending");
  assert.equal(p.toCreate[0].transactionId, null);
});

test("una ocurrencia pendiente existente se liga cuando aparece el movimiento (toLink, no crea duplicado)", () => {
  const p = plan({ existing: [stored()], transactions: [tx({ conceptId: 7 })] });
  assert.equal(p.toCreate.length, 0);
  assert.deepEqual(p.toLink, [{ occurrenceId: 500, transactionId: 100, matchScore: 100 }]);
});

test("nunca toca lo manual ni lo omitido, aunque haya un movimiento que coincida", () => {
  const manual = stored({ status: "paid", matchSource: "manual", transactionId: null });
  const skipped = stored({ id: 501, recurringItemId: 2, status: "skipped" });
  const p = plan({
    items: [item(), item({ id: 2, conceptId: 8, providerId: 15 })],
    existing: [manual, skipped],
    transactions: [tx({ conceptId: 7 }), tx({ id: 101, conceptId: 8 })],
  });
  assert.equal(isEmptyOccurrenceSyncPlan(p), true);
});

test("un movimiento ya ligado a otra ocurrencia no se reutiliza", () => {
  const p = plan({
    items: [item({ id: 1, conceptId: 7 }), item({ id: 2, conceptId: 7 })],
    existing: [stored({ id: 500, recurringItemId: 1, status: "paid", matchSource: "auto", transactionId: 100 })],
    transactions: [tx({ id: 100, conceptId: 7 })],
  });
  assert.equal(p.toLink.length, 0);
  assert.equal(p.toCreate.length, 1);
  assert.equal(p.toCreate[0].recurringItemId, 2);
  assert.equal(p.toCreate[0].status, "pending");
});

test("un mismo movimiento no paga dos ocurrencias nuevas a la vez", () => {
  const p = plan({
    items: [item({ id: 1, conceptId: 7 }), item({ id: 2, conceptId: 7 })],
    transactions: [tx({ conceptId: 7 })],
  });
  assert.equal(p.toCreate.filter((c) => c.status === "paid").length, 1);
});

test("si el movimiento de una ocurrencia pagada automáticamente desaparece, vuelve a pendiente", () => {
  const p = plan({ existing: [stored({ status: "paid", matchSource: "auto", transactionId: 100 })], transactions: [] });
  assert.deepEqual(p.toUnlink, [500]);
});

test("si además hay otro movimiento que la cubre, se desliga y se vuelve a ligar en el mismo plan", () => {
  const p = plan({
    existing: [stored({ status: "paid", matchSource: "auto", transactionId: 100 })],
    transactions: [tx({ id: 200, conceptId: 7 })],
  });
  assert.deepEqual(p.toUnlink, [500]);
  assert.deepEqual(p.toLink, [{ occurrenceId: 500, transactionId: 200, matchScore: 100 }]);
});

test("idempotencia: con el estado ya sincronizado el plan es vacío", () => {
  const first = plan({ transactions: [tx({ conceptId: 7 })] });
  const created = first.toCreate[0];
  const alreadySynced = stored({ status: created.status, transactionId: created.transactionId, matchSource: created.matchSource });
  const second = plan({ existing: [alreadySynced], transactions: [tx({ conceptId: 7 })] });
  assert.equal(isEmptyOccurrenceSyncPlan(second), true);
});

test("un ingreso recurrente no se paga con un gasto", () => {
  const p = plan({ items: [item({ flow: "income", estimatedAmountCents: 1000000 })], transactions: [tx({ conceptId: 7, amountCents: -1000000 })] });
  assert.equal(p.toCreate[0].status, "pending");
});

test("un 'deshacer' del usuario (pendiente marcada manual) no se vuelve a ligar automáticamente", () => {
  const p = plan({ existing: [stored({ status: "pending", matchSource: "manual" })], transactions: [tx({ conceptId: 7 })] });
  assert.equal(isEmptyOccurrenceSyncPlan(p), true);
});

test("si cambia el día del recurrente, la pendiente vieja se elimina y se crea la nueva", () => {
  const p = plan({ items: [item({ dayOfMonth: 5 })], existing: [stored({ expectedDate: "2026-10-02" })] });
  assert.deepEqual(p.toDelete, [500]);
  assert.equal(p.toCreate.length, 1);
  assert.equal(p.toCreate[0].expectedDate, "2026-10-05");
});

test("si el recurrente se pausa, su ocurrencia pendiente se elimina; la pagada se conserva como historial", () => {
  const pendiente = stored({ id: 500 });
  const pagada = stored({ id: 501, recurringItemId: 2, status: "paid", matchSource: "auto", transactionId: 100 });
  const p = plan({
    items: [item({ status: "paused" }), item({ id: 2, status: "paused" })],
    existing: [pendiente, pagada],
    transactions: [tx({ id: 100, conceptId: 7 })],
  });
  assert.deepEqual(p.toDelete, [500]);
  assert.deepEqual(p.toUnlink, []);
});

test("lo omitido y lo pagado a mano nunca se eliminan aunque el recurrente cambie de día", () => {
  const omitida = stored({ id: 500, status: "skipped", matchSource: "manual" });
  const manual = stored({ id: 501, expectedDate: "2026-10-03", status: "paid", matchSource: "manual" });
  const p = plan({ items: [item({ dayOfMonth: 9 })], existing: [omitida, manual] });
  assert.deepEqual(p.toDelete, []);
});

test("si cambia el monto estimado del recurrente, se refresca el de la ocurrencia pendiente (no el de las pagadas)", () => {
  const pendiente = plan({ items: [item({ estimatedAmountCents: -52900 })], existing: [stored()] });
  assert.deepEqual(pendiente.toRefreshAmount, [{ occurrenceId: 500, expectedAmountCents: -52900 }]);
  const pagada = plan({
    items: [item({ estimatedAmountCents: -52900 })],
    existing: [stored({ status: "paid", matchSource: "manual" })],
  });
  assert.deepEqual(pagada.toRefreshAmount, []);
});

import {
  InvalidOccurrenceDecisionError,
  OCCURRENCE_DECISIONS,
  assertValidOccurrenceDecision,
  occurrenceDecisionOutcome,
} from "./occurrences";

test("decisiones del usuario: cada una produce su estado y siempre queda marcada 'manual'", () => {
  assert.deepEqual(occurrenceDecisionOutcome("mark_paid"), { status: "paid", matchSource: "manual" });
  assert.deepEqual(occurrenceDecisionOutcome("skip"), { status: "skipped", matchSource: "manual" });
  assert.deepEqual(occurrenceDecisionOutcome("reopen"), { status: "pending", matchSource: "manual" });
  for (const d of OCCURRENCE_DECISIONS) assert.equal(occurrenceDecisionOutcome(d).matchSource, "manual");
});

test("assertValidOccurrenceDecision: rechaza decisiones inventadas", () => {
  for (const d of OCCURRENCE_DECISIONS) assert.doesNotThrow(() => assertValidOccurrenceDecision(d));
  assert.throws(() => assertValidOccurrenceDecision("delete"), InvalidOccurrenceDecisionError);
});

test("el ciclo completo: pagar a mano, deshacer y que el matching no la vuelva a ligar", () => {
  const reopened = stored({ ...occurrenceDecisionOutcome("reopen"), transactionId: null });
  const p = plan({ existing: [reopened], transactions: [tx({ conceptId: 7 })] });
  assert.equal(p.toLink.length, 0);
  assert.equal(p.toCreate.length, 0);
});
