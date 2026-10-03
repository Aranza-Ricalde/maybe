import assert from "node:assert/strict";
import { test } from "node:test";
import { levelsToDeltas, monthSampleDate, rangeBounds, shiftDays } from "./rules";

test("shiftDays: suma y resta días, incluyendo cambio de mes", () => {
  assert.equal(shiftDays("2026-10-05", -5), "2026-09-30");
  assert.equal(shiftDays("2026-10-05", 5), "2026-10-10");
});

test("rangeBounds: 30d da granularidad diaria con 30 días terminando hoy", () => {
  const result = rangeBounds("30d", "2026-10-15");
  assert.equal(result.granularity, "daily");
  assert.equal(result.fromDate, "2026-09-16");
  assert.deepEqual(result.months, []);
});

test("rangeBounds: 3m da 3 meses ascendentes, terminando en el mes actual", () => {
  const result = rangeBounds("3m", "2026-10-15");
  assert.equal(result.granularity, "monthly");
  assert.deepEqual(result.months, ["2026-08-01", "2026-09-01", "2026-10-01"]);
  assert.equal(result.fromDate, "2026-08-01");
});

test("rangeBounds: 1y da 12 meses, incluyendo cambio de año", () => {
  const result = rangeBounds("1y", "2026-02-10");
  assert.equal(result.months.length, 12);
  assert.equal(result.months[0], "2025-03-01");
  assert.equal(result.months[11], "2026-02-01");
});

test("monthSampleDate: mes ya cerrado usa su fin de mes", () => {
  assert.equal(monthSampleDate("2026-09-01", "2026-10-15"), "2026-09-30");
});

test("monthSampleDate: mes en curso usa 'hoy', no un fin de mes que todavía no llega", () => {
  assert.equal(monthSampleDate("2026-10-01", "2026-10-15"), "2026-10-15");
});

test("levelsToDeltas: N+1 niveles dan N deltas, cada uno contra el nivel anterior", () => {
  const result = levelsToDeltas([
    { date: "2026-08-31", value: 100 },
    { date: "2026-09-01", value: 130 },
    { date: "2026-10-01", value: 110 },
  ]);
  assert.deepEqual(result, [
    { date: "2026-09-01", value: 30 },
    { date: "2026-10-01", value: -20 },
  ]);
});
