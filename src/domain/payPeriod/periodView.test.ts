import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PERIOD_VIEW, InvalidPeriodViewError, assertValidPeriodView, groupPeriodsByMonth, monthName, normalizePeriodView, planMonthResize, withMonthShare } from "./periodView";

const PERIODS = [
  { id: 1, start: "2026-08-28", end: "2026-09-13" },
  { id: 2, start: "2026-09-14", end: "2026-09-28" },
  { id: 3, start: "2026-09-29", end: "2026-10-13" },
  { id: 4, start: "2026-10-14", end: "2026-10-29" },
  { id: 5, start: "2026-10-30", end: "2026-11-12" },
];

test("la vista por defecto es mensual y los valores inválidos o vacíos caen a ella", () => {
  assert.equal(DEFAULT_PERIOD_VIEW, "monthly");
  assert.equal(normalizePeriodView(null), "monthly");
  assert.equal(normalizePeriodView("loquesea"), "monthly");
  assert.equal(normalizePeriodView("biweekly"), "biweekly");
});

test("assertValidPeriodView acepta quincenal y mensual y rechaza lo demás", () => {
  assert.doesNotThrow(() => assertValidPeriodView("monthly"));
  assert.throws(() => assertValidPeriodView("semanal"), InvalidPeriodViewError);
});

test("agrupa las quincenas por el mes en el que terminan", () => {
  const months = groupPeriodsByMonth(PERIODS);
  assert.deepEqual(months.map((m) => [m.key, m.periods.map((p) => p.id)]), [["2026-09", [1, 2]], ["2026-10", [3, 4]], ["2026-11", [5]]]);
});

test("monthName escribe el mes en español con mayúscula", () => {
  assert.equal(monthName("2026-10"), "Octubre 2026");
});

test("withMonthShare reparte el mes en partes iguales entre sus quincenas", () => {
  const selected = withMonthShare(PERIODS, [PERIODS[2], PERIODS[4]]);
  assert.deepEqual(selected.map((p) => p.monthShare), [0.5, 1]);
});

test("planMonthResize cambia el inicio de la primera quincena y el fin de la última del mes", () => {
  assert.deepEqual(planMonthResize(PERIODS, 4, "2026-09-30", "2026-10-28"), { updates: [{ id: 3, start: "2026-09-30", end: "2026-10-13" }, { id: 4, start: "2026-10-14", end: "2026-10-28" }] });
});

test("planMonthResize solo actualiza lo que cambia", () => {
  assert.deepEqual(planMonthResize(PERIODS, 3, "2026-09-29", "2026-10-28"), { updates: [{ id: 4, start: "2026-10-14", end: "2026-10-28" }] });
  assert.deepEqual(planMonthResize(PERIODS, 3, "2026-09-29", "2026-10-29"), { updates: [] });
});

test("planMonthResize rechaza traslapes con meses vecinos, rangos invertidos y dejar vacía una quincena", () => {
  assert.ok("error" in planMonthResize(PERIODS, 3, "2026-09-28", "2026-10-29"));
  assert.ok("error" in planMonthResize(PERIODS, 4, "2026-09-29", "2026-10-30"));
  assert.ok("error" in planMonthResize(PERIODS, 3, "2026-10-29", "2026-10-01"));
  assert.ok("error" in planMonthResize(PERIODS, 3, "2026-10-14", "2026-10-29"));
  assert.ok("error" in planMonthResize(PERIODS, 99, "2026-10-01", "2026-10-02"));
});

test("planMonthResize en un mes con una sola quincena ajusta ambos extremos", () => {
  assert.deepEqual(planMonthResize(PERIODS, 5, "2026-10-31", "2026-11-15"), { updates: [{ id: 5, start: "2026-10-31", end: "2026-11-15" }] });
});
