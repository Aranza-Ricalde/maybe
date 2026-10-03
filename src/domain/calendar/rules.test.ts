import assert from "node:assert/strict";
import { test } from "node:test";
import {
  financialCalendarEntries,
  groupCalendarEntriesByStatus,
  type CalendarEntry,
  type CalendarRecurringInput,
  type CalendarScheduledInput,
  type CalendarTransactionInput,
} from "./rules";

const PERIOD_START = "2026-09-29";
const PERIOD_END = "2026-10-14";
const TODAY = "2026-10-03";

function recurring(overrides: Partial<CalendarRecurringInput> = {}): CalendarRecurringInput {
  return {
    name: "Internet Casa",
    flow: "expense",
    status: "active",
    dayOfMonth: 29,
    estimatedAmountCents: -49900,
    accountId: null,
    categoryId: 43,
    conceptId: 7,
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

test("financialCalendarEntries: con una transacción real que coincide por conceptId, status es 'paid' y expone los datos reales", () => {
  const tx: CalendarTransactionInput = { name: "PAGO MI TELMEX", date: "2026-09-29", amountCents: -49900, accountId: 52, categoryId: 43, conceptId: 7 };
  const [entry] = financialCalendarEntries([recurring()], [], [tx], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entry.status, "paid");
  assert.equal(entry.source, "recurrente");
  assert.equal(entry.actualName, "PAGO MI TELMEX");
  assert.equal(entry.actualDate, "2026-09-29");
  assert.equal(entry.actualAmountCents, -49900);
});

test("financialCalendarEntries: sin transacción que coincida y fecha esperada ya pasada, status es 'overdue'", () => {
  const [entry] = financialCalendarEntries([recurring()], [], [], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entry.status, "overdue");
  assert.equal(entry.actualDate, null);
});

test("financialCalendarEntries: sin transacción y fecha esperada futura, status es 'pending'", () => {
  const [entry] = financialCalendarEntries([recurring({ dayOfMonth: 13 })], [], [], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entry.expectedDate, "2026-10-13");
  assert.equal(entry.status, "pending");
});

test("financialCalendarEntries: un recurrente cuyo día no cae en el periodo visible no aparece", () => {
  const entries = financialCalendarEntries([recurring({ dayOfMonth: 20 })], [], [], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entries.length, 0);
});

test("financialCalendarEntries: sin conceptId, usa accountId+categoryId como señal (igual que antes)", () => {
  const r = recurring({ conceptId: null, accountId: 47, categoryId: 54, name: "Teléfono", dayOfMonth: 1 });
  const tx: CalendarTransactionInput = { name: "Teléfono", date: "2026-10-01", amountCents: -20000, accountId: 47, categoryId: 54, conceptId: null };
  const [entry] = financialCalendarEntries([r], [], [tx], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entry.status, "paid");
});

test("financialCalendarEntries: sin conceptId y sin accountId (ninguna señal), nunca se marca pagado aunque haya transacciones de esa categoría", () => {
  const r = recurring({ conceptId: null, accountId: null, categoryId: 43, dayOfMonth: 29 });
  const tx: CalendarTransactionInput = { name: "Otra cosa", date: "2026-09-29", amountCents: -49900, accountId: 99, categoryId: 43, conceptId: null };
  const [entry] = financialCalendarEntries([r], [], [tx], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entry.status, "overdue");
});

test("financialCalendarEntries: recurrentes pausados no aparecen", () => {
  const entries = financialCalendarEntries([recurring({ status: "paused" })], [], [], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entries.length, 0);
});

test("financialCalendarEntries: ordena por fecha esperada ascendente, mezclando recurrentes y programados", () => {
  const r1 = recurring({ name: "Internet Casa", dayOfMonth: 13 });
  const r2 = recurring({ name: "Teléfono", dayOfMonth: 1, conceptId: 4, categoryId: 54 });
  const s1 = scheduled({ name: "Pago tarjeta", scheduledDate: "2026-10-07" });
  const entries = financialCalendarEntries([r1, r2], [s1], [], TODAY, PERIOD_START, PERIOD_END);
  assert.deepEqual(entries.map((e) => e.name), ["Teléfono", "Pago tarjeta", "Internet Casa"]);
});

test("financialCalendarEntries: ingresos (flow income) también se incluyen, no solo gastos", () => {
  const r = recurring({ flow: "income", name: "Nómina", estimatedAmountCents: 1000000, conceptId: 50, categoryId: null, dayOfMonth: 1 });
  const entries = financialCalendarEntries([r], [], [], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].flow, "income");
});

test("financialCalendarEntries: un pago programado dentro del periodo aparece con source 'programado'", () => {
  const [entry] = financialCalendarEntries([], [scheduled()], [], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entry.source, "programado");
  assert.equal(entry.expectedDate, "2026-10-05");
  assert.equal(entry.status, "pending");
});

test("financialCalendarEntries: un pago programado con transacción real coincidente (cuenta+categoría) queda 'paid'", () => {
  const tx: CalendarTransactionInput = { name: "Pago Nu TDC", date: "2026-10-05", amountCents: -250000, accountId: 47, categoryId: 60, conceptId: null };
  const [entry] = financialCalendarEntries([], [scheduled()], [tx], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entry.status, "paid");
  assert.equal(entry.actualName, "Pago Nu TDC");
});

test("financialCalendarEntries: un pago programado fuera del periodo, cancelado, o de ingreso no aparece", () => {
  const outside = scheduled({ scheduledDate: "2026-11-01" });
  const cancelled = scheduled({ status: "cancelled" });
  const income = scheduled({ amountCents: 500000 });
  const entries = financialCalendarEntries([], [outside, cancelled, income], [], TODAY, PERIOD_START, PERIOD_END);
  assert.equal(entries.length, 0);
});

test("financialCalendarEntries: un periodo que cruza de mes ubica un recurrente de fin de mes en septiembre, no en octubre", () => {
  const [entry] = financialCalendarEntries(
    [recurring({ name: "Basura", dayOfMonth: 30, categoryId: 20, conceptId: null, accountId: 1 })],
    [],
    [],
    "2026-09-29",
    "2026-09-29",
    "2026-10-13",
  );
  assert.equal(entry.expectedDate, "2026-09-30");
});

test("principio #34: con conceptId, dos recurrentes de la MISMA cuenta+categoría ya no se confunden entre sí", () => {
  // Luz e Internet comparten cuenta y categoría (como en principios.md), pero tienen concepto distinto.
  // Solo se paga Luz (concepto 2) este periodo -> Internet (concepto 1) debe seguir pendiente/atrasado.
  const tx: CalendarTransactionInput = { name: "CFE", date: "2026-10-01", amountCents: -80000, accountId: 1, categoryId: 54, conceptId: 2 };
  const entries = financialCalendarEntries(
    [
      recurring({ name: "Internet Casa", dayOfMonth: 2, categoryId: 54, conceptId: 1, accountId: 1 }),
      recurring({ name: "Luz", dayOfMonth: 3, categoryId: 54, conceptId: 2, accountId: 1 }),
    ],
    [],
    [tx],
    "2026-10-01",
    PERIOD_START,
    PERIOD_END,
  );
  const internet = entries.find((e) => e.name === "Internet Casa");
  const luz = entries.find((e) => e.name === "Luz");
  assert.equal(luz?.status, "paid");
  assert.notEqual(internet?.status, "paid");
});

function entry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    name: "Internet Casa",
    flow: "expense",
    source: "recurrente",
    expectedDate: "2026-10-05",
    expectedAmountCents: -49900,
    status: "pending",
    actualName: null,
    actualDate: null,
    actualAmountCents: null,
    ...overrides,
  };
}

test("groupCalendarEntriesByStatus: separa lo pendiente/atrasado (por pagar) de lo ya pagado", () => {
  const { pending, paid } = groupCalendarEntriesByStatus([
    entry({ name: "A", status: "paid" }),
    entry({ name: "B", status: "pending" }),
    entry({ name: "C", status: "overdue" }),
  ]);
  assert.deepEqual(pending.map((e) => e.name), ["C", "B"]);
  assert.deepEqual(paid.map((e) => e.name), ["A"]);
});

test("groupCalendarEntriesByStatus: dentro de 'por pagar', los atrasados van antes que los pendientes sin importar la fecha", () => {
  const { pending } = groupCalendarEntriesByStatus([
    entry({ name: "Pendiente futuro", status: "pending", expectedDate: "2026-10-01" }),
    entry({ name: "Atrasado tardío", status: "overdue", expectedDate: "2026-10-10" }),
  ]);
  assert.deepEqual(pending.map((e) => e.name), ["Atrasado tardío", "Pendiente futuro"]);
});

test("groupCalendarEntriesByStatus: una lista vacía produce ambos grupos vacíos", () => {
  const { pending, paid } = groupCalendarEntriesByStatus([]);
  assert.equal(pending.length, 0);
  assert.equal(paid.length, 0);
});
