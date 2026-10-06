import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePeriodIds, resolvePeriodSelection } from "./selection";

const PERIODS = [
  { id: 10, start: "2026-09-01", end: "2026-09-14" },
  { id: 11, start: "2026-09-15", end: "2026-09-28" },
  { id: 12, start: "2026-09-29", end: "2026-10-13" },
  { id: 13, start: "2026-10-14", end: "2026-10-28" },
];

test("sin parámetro elige el periodo de hoy y el anterior", () => {
  const selection = resolvePeriodSelection(PERIODS, undefined, "2026-10-06");
  assert.deepEqual(selection.selectedIds, [12]);
  assert.equal(selection.previousPeriod.id, 11);
  assert.deepEqual(selection.displayPeriod, { start: "2026-09-29", end: "2026-10-13" });
  assert.equal(selection.currentIndex, 2);
});

test("varios periodos: rango completo y el anterior al primero elegido", () => {
  const selection = resolvePeriodSelection(PERIODS, "13,12", "2026-10-06");
  assert.deepEqual(selection.selectedIds, [12, 13]);
  assert.deepEqual(selection.displayPeriod, { start: "2026-09-29", end: "2026-10-28" });
  assert.equal(selection.previousPeriod.id, 11);
});

test("ids desconocidos o inválidos se ignoran y caen al periodo actual", () => {
  assert.deepEqual(resolvePeriodSelection(PERIODS, "99,abc,-1", "2026-10-06").selectedIds, [12]);
  assert.deepEqual(parsePeriodIds("1,x,2,0"), [1, 2]);
});

test("el primer periodo no tiene anterior: usa el mismo", () => {
  const selection = resolvePeriodSelection(PERIODS, "10", "2026-10-06");
  assert.equal(selection.previousPeriod.id, 10);
});

import { periodOptions } from "./selection";

test("periodOptions numera las quincenas y marca la actual", () => {
  const options = periodOptions(PERIODS, 2);
  assert.equal(options.length, 4);
  assert.match(options[0].label, /^Quincena 1 · /);
  assert.deepEqual(options.map((o) => o.isCurrent), [false, false, true, false]);
});
