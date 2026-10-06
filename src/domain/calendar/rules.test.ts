import assert from "node:assert/strict";
import { test } from "node:test";
import {
  financialCalendarEntries,
  groupCalendarEntriesByStatus,
  type CalendarEntry,
  type CalendarOccurrenceInput,
  type CalendarScheduledInput,
  type CalendarTransactionInput,
} from "./rules";

const PERIOD_START = "2026-09-29";
const PERIOD_END = "2026-10-14";
const TODAY = "2026-10-03";

function occurrence(overrides: Partial<CalendarOccurrenceInput> = {}): CalendarOccurrenceInput {
  return {
    id: 1,
    name: "Internet Casa",
    flow: "expense",
    expectedDate: "2026-09-29",
    expectedAmountCents: -49900,
    status: "pending",
    matchSource: null,
    transaction: null,
    ...overrides,
  };
}

function scheduled(overrides: Partial<CalendarScheduledInput> = {}): CalendarScheduledInput {
  return {
    name: "Pago tarjeta",
    amountCents: -250000,
    scheduledDate: "2026-10-05",
    status: "planned",
    accountId: 47,
    categoryId: 60,
    ...overrides,
  };
}

function tx(overrides: Partial<CalendarTransactionInput> = {}): CalendarTransactionInput {
  return { id: 900, name: "Pago Nu TDC", date: "2026-10-05", amountCents: -250000, accountId: 47, categoryId: 60, conceptId: null, providerId: null, ...overrides };
}

function entriesOf(
  occurrences: CalendarOccurrenceInput[],
  scheduledItems: CalendarScheduledInput[] = [],
  transactions: CalendarTransactionInput[] = [],
  today = TODAY,
) {
  return financialCalendarEntries(occurrences, scheduledItems, transactions, today, PERIOD_START, PERIOD_END);
}

test("una ocurrencia pagada por un movimiento expone el movimiento real y su id de ocurrencia", () => {
  const [entry] = entriesOf([
    occurrence({ status: "paid", matchSource: "auto", transaction: { id: 10, name: "PAGO MI TELMEX", date: "2026-09-29", amountCents: -49900 } }),
  ]);
  assert.equal(entry.status, "paid");
  assert.equal(entry.source, "recurrente");
  assert.equal(entry.occurrenceId, 1);
  assert.equal(entry.isManual, false);
  assert.equal(entry.actualName, "PAGO MI TELMEX");
  assert.equal(entry.actualDate, "2026-09-29");
  assert.equal(entry.actualAmountCents, -49900);
});

test("una ocurrencia pagada a mano, sin movimiento, es 'paid' y manual, sin datos reales", () => {
  const [entry] = entriesOf([occurrence({ status: "paid", matchSource: "manual" })]);
  assert.equal(entry.status, "paid");
  assert.equal(entry.isManual, true);
  assert.equal(entry.actualDate, null);
});

test("una ocurrencia pendiente con fecha esperada ya pasada es 'overdue'", () => {
  const [entry] = entriesOf([occurrence({ expectedDate: "2026-09-29" })]);
  assert.equal(entry.status, "overdue");
});

test("una ocurrencia pendiente con fecha esperada futura es 'pending'", () => {
  const [entry] = entriesOf([occurrence({ expectedDate: "2026-10-13" })]);
  assert.equal(entry.status, "pending");
});

test("una ocurrencia omitida es 'skipped' y no cuenta como atrasada", () => {
  const [entry] = entriesOf([occurrence({ status: "skipped", matchSource: "manual", expectedDate: "2026-09-29" })]);
  assert.equal(entry.status, "skipped");
  assert.equal(entry.isManual, true);
});

test("un 'deshacer' (pendiente marcada manual) vuelve a verse como atrasada o pendiente, y es manual", () => {
  const [entry] = entriesOf([occurrence({ status: "pending", matchSource: "manual", expectedDate: "2026-09-29" })]);
  assert.equal(entry.status, "overdue");
  assert.equal(entry.isManual, true);
});

test("ingresos (flow income) también se incluyen, no solo gastos", () => {
  const [entry] = entriesOf([occurrence({ flow: "income", name: "Nómina", expectedAmountCents: 1000000 })]);
  assert.equal(entry.flow, "income");
});

test("ordena por fecha esperada ascendente, mezclando recurrentes y programados", () => {
  const entries = entriesOf(
    [occurrence({ id: 1, name: "Internet Casa", expectedDate: "2026-10-13" }), occurrence({ id: 2, name: "Teléfono", expectedDate: "2026-10-01" })],
    [scheduled({ name: "Pago tarjeta", scheduledDate: "2026-10-07" })],
  );
  assert.deepEqual(entries.map((e) => e.name), ["Teléfono", "Pago tarjeta", "Internet Casa"]);
});

test("un pago programado dentro del periodo aparece con source 'programado' y sin ocurrencia", () => {
  const [entry] = entriesOf([], [scheduled()]);
  assert.equal(entry.source, "programado");
  assert.equal(entry.occurrenceId, null);
  assert.equal(entry.expectedDate, "2026-10-05");
  assert.equal(entry.status, "pending");
});

test("un pago programado con transacción real coincidente (cuenta+categoría) queda 'paid'", () => {
  const [entry] = entriesOf([], [scheduled()], [tx()]);
  assert.equal(entry.status, "paid");
  assert.equal(entry.actualName, "Pago Nu TDC");
});

test("un pago programado fuera del periodo, cancelado, o de ingreso no aparece", () => {
  const entries = entriesOf([], [
    scheduled({ scheduledDate: "2026-11-01" }),
    scheduled({ status: "cancelled" }),
    scheduled({ amountCents: 500000 }),
  ]);
  assert.equal(entries.length, 0);
});

test("un movimiento que ya pagó una ocurrencia no puede pagar además un pago programado", () => {
  const claimed = tx({ id: 900 });
  const entries = entriesOf(
    [occurrence({ status: "paid", matchSource: "auto", transaction: { id: 900, name: claimed.name, date: claimed.date, amountCents: claimed.amountCents } })],
    [scheduled()],
    [claimed],
  );
  assert.equal(entries.find((e) => e.source === "programado")?.status, "pending");
});

function entry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    occurrenceId: 1,
    name: "Internet Casa",
    flow: "expense",
    source: "recurrente",
    expectedDate: "2026-10-05",
    expectedAmountCents: -49900,
    status: "pending",
    isManual: false,
    actualName: null,
    actualDate: null,
    actualAmountCents: null,
    ...overrides,
  };
}

test("groupCalendarEntriesByStatus: separa por pagar, pagado y omitido", () => {
  const { pending, paid, skipped } = groupCalendarEntriesByStatus([
    entry({ name: "A", status: "paid" }),
    entry({ name: "B", status: "pending" }),
    entry({ name: "C", status: "overdue" }),
    entry({ name: "D", status: "skipped" }),
  ]);
  assert.deepEqual(pending.map((e) => e.name), ["C", "B"]);
  assert.deepEqual(paid.map((e) => e.name), ["A"]);
  assert.deepEqual(skipped.map((e) => e.name), ["D"]);
});

test("groupCalendarEntriesByStatus: dentro de 'por pagar', los atrasados van antes que los pendientes sin importar la fecha", () => {
  const { pending } = groupCalendarEntriesByStatus([
    entry({ name: "Pendiente futuro", status: "pending", expectedDate: "2026-10-01" }),
    entry({ name: "Atrasado tardío", status: "overdue", expectedDate: "2026-10-10" }),
  ]);
  assert.deepEqual(pending.map((e) => e.name), ["Atrasado tardío", "Pendiente futuro"]);
});

test("groupCalendarEntriesByStatus: una lista vacía produce los tres grupos vacíos", () => {
  const { pending, paid, skipped } = groupCalendarEntriesByStatus([]);
  assert.equal(pending.length + paid.length + skipped.length, 0);
});
