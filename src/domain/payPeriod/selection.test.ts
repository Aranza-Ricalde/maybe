import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePeriodIds, periodOptions, resolvePeriodSelection } from "./selection";

const PERIODS = [
  { id: 10, start: "2026-09-01", end: "2026-09-14" },
  { id: 11, start: "2026-09-15", end: "2026-09-28" },
  { id: 12, start: "2026-09-29", end: "2026-10-13" },
  { id: 13, start: "2026-10-14", end: "2026-10-28" },
];

test("vista quincenal sin parámetro: la quincena de hoy y el periodo anterior", () => {
  const selection = resolvePeriodSelection(PERIODS, undefined, "2026-10-06", "biweekly");
  assert.deepEqual(selection.selectedIds, [12]);
  assert.deepEqual(selection.previousRange, { start: "2026-09-15", end: "2026-09-28" });
  assert.deepEqual(selection.displayPeriod, { start: "2026-09-29", end: "2026-10-13" });
  assert.equal(selection.currentIndex, 2);
  assert.deepEqual(selection.selectedPeriods.map((p) => p.monthShare), [0.5]);
});

test("vista mensual sin parámetro: el mes de pago de hoy completo (las dos quincenas que terminan en él)", () => {
  const selection = resolvePeriodSelection(PERIODS, undefined, "2026-10-06", "monthly");
  assert.deepEqual(selection.selectedPeriods.map((p) => p.id), [12, 13]);
  assert.deepEqual(selection.selectedIds, [12]);
  assert.deepEqual(selection.displayPeriod, { start: "2026-09-29", end: "2026-10-28" });
  assert.deepEqual(selection.selectedPeriods.map((p) => p.monthShare), [0.5, 0.5]);
  assert.deepEqual(selection.previousRange, { start: "2026-09-01", end: "2026-09-28" });
});

test("vista mensual: hoy en la segunda quincena elige el mismo mes, y en septiembre el mes de septiembre", () => {
  assert.deepEqual(resolvePeriodSelection(PERIODS, undefined, "2026-10-20", "monthly").selectedPeriods.map((p) => p.id), [12, 13]);
  assert.deepEqual(resolvePeriodSelection(PERIODS, undefined, "2026-09-10", "monthly").selectedPeriods.map((p) => p.id), [10, 11]);
});

test("vista mensual: elegir cualquier quincena del mes selecciona el mes completo", () => {
  assert.deepEqual(resolvePeriodSelection(PERIODS, "13", "2026-10-06", "monthly").selectedPeriods.map((p) => p.id), [12, 13]);
});

test("vista quincenal con varias quincenas: rango completo y el mismo número de periodos anteriores", () => {
  const selection = resolvePeriodSelection(PERIODS, "13,12", "2026-10-06", "biweekly");
  assert.deepEqual(selection.selectedIds, [12, 13]);
  assert.deepEqual(selection.displayPeriod, { start: "2026-09-29", end: "2026-10-28" });
  assert.deepEqual(selection.previousRange, { start: "2026-09-01", end: "2026-09-28" });
});

test("un mes con una sola quincena en la lista la cuenta completa", () => {
  const selection = resolvePeriodSelection([{ id: 1, start: "2026-10-01", end: "2026-10-14" }], undefined, "2026-10-06", "monthly");
  assert.deepEqual(selection.selectedPeriods.map((p) => [p.id, p.monthShare]), [[1, 1]]);
});

test("ids desconocidos o inválidos se ignoran y caen al periodo de hoy", () => {
  assert.deepEqual(resolvePeriodSelection(PERIODS, "99,abc,-1", "2026-10-06", "biweekly").selectedIds, [12]);
  assert.deepEqual(parsePeriodIds("1,x,2,0"), [1, 2]);
});

test("el primer periodo no tiene anterior: compara contra sí mismo", () => {
  const selection = resolvePeriodSelection(PERIODS, "10", "2026-10-06", "biweekly");
  assert.deepEqual(selection.previousRange, { start: "2026-09-01", end: "2026-09-14" });
});

test("periodOptions quincenal numera las quincenas y marca la actual", () => {
  const options = periodOptions(PERIODS, 2, "biweekly");
  assert.equal(options.length, 4);
  assert.match(options[0].label, /^Quincena 1 · /);
  assert.deepEqual(options.map((o) => o.isCurrent), [false, false, true, false]);
});

test("periodOptions mensual lista un mes por opción, con su nombre y rango, y marca el actual", () => {
  const options = periodOptions(PERIODS, 2, "monthly");
  assert.deepEqual(options.map((o) => o.id), [10, 12]);
  assert.match(options[1].label, /^Octubre 2026 · /);
  assert.deepEqual(options.map((o) => o.isCurrent), [false, true]);
});
