import assert from "node:assert/strict";
import { test } from "node:test";
import { computeCashflowProjection, dayOfMonthOf, daysInMonth, endOfMonth } from "./rules";

test("daysInMonth: meses de 28/30/31 días", () => {
  assert.equal(daysInMonth("2026-02-10"), 28);
  assert.equal(daysInMonth("2024-02-10"), 29);
  assert.equal(daysInMonth("2026-04-01"), 30);
  assert.equal(daysInMonth("2026-12-25"), 31);
});

test("dayOfMonthOf extrae el día", () => {
  assert.equal(dayOfMonthOf("2026-06-15"), 15);
  assert.equal(dayOfMonthOf("2026-06-01"), 1);
});

test("endOfMonth da el último día real del mes", () => {
  assert.equal(endOfMonth("2026-02-10"), "2026-02-28");
  assert.equal(endOfMonth("2026-06-01"), "2026-06-30");
});

test("computeCashflowProjection: caso base (replica el smoke test contra Neon, pero sin DB)", () => {
  const result = computeCashflowProjection({
    asOfDate: "2026-06-15",
    currentBalanceCents: 1_000_000,
    activeRecurringItems: [
      { name: "Gym", dayOfMonth: 5, estimatedAmountCents: -30_000 },
      { name: "Netflix", dayOfMonth: 20, estimatedAmountCents: -5_000 },
      { name: "Nómina", dayOfMonth: 25, estimatedAmountCents: 200_000 },
    ],
    plannedScheduled: [{ name: "Dentista", scheduledDate: "2026-06-18", amountCents: -10_000 }],
    recentMonthlyExpenseCents: [-200_000, -180_000, -220_000],
  });

  assert.equal(result.currentBalanceCents, 1_000_000);
  assert.equal(result.remainingRecurringCents, 195_000);
  assert.equal(result.remainingScheduledCents, -10_000);
  assert.equal(result.projectedVariableSpendCents, -82_500);
  assert.equal(result.projectedEndOfMonthBalanceCents, 1_000_000 + 195_000 - 10_000 - 82_500);
});

test("computeCashflowProjection: sin historial ni recurrentes ni programados, no proyecta gasto variable", () => {
  const result = computeCashflowProjection({
    asOfDate: "2026-06-15",
    currentBalanceCents: 50_000,
    activeRecurringItems: [],
    plannedScheduled: [],
    recentMonthlyExpenseCents: [],
  });
  assert.equal(result.remainingRecurringCents, 0);
  assert.equal(result.remainingScheduledCents, 0);
  assert.equal(result.projectedVariableSpendCents, 0);
  assert.equal(result.projectedEndOfMonthBalanceCents, 50_000);
});

test("computeCashflowProjection: si el recurrente ya es mayor que el promedio histórico, el variable se clampa a 0 (no se vuelve positivo)", () => {
  const result = computeCashflowProjection({
    asOfDate: "2026-06-15",
    currentBalanceCents: 0,
    activeRecurringItems: [{ name: "Renta", dayOfMonth: 20, estimatedAmountCents: -500_000 }],
    plannedScheduled: [],
    recentMonthlyExpenseCents: [-100_000],
  });
  assert.equal(result.projectedVariableSpendCents, 0);
});

test("computeCashflowProjection: un recurrente cuyo día ya pasó este mes no se cuenta como remanente", () => {
  const result = computeCashflowProjection({
    asOfDate: "2026-06-20",
    currentBalanceCents: 0,
    activeRecurringItems: [{ name: "Gym", dayOfMonth: 5, estimatedAmountCents: -30_000 }],
    plannedScheduled: [],
    recentMonthlyExpenseCents: [],
  });
  assert.equal(result.remainingRecurringCents, 0);
});
