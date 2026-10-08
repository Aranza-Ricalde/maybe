import assert from "node:assert/strict";
import { test } from "node:test";
import { dayRangeFromIso, isoRangeFromDays, isoToLocalDate, localDateToIso } from "./calendarRange";

test("convierte entre fecha ISO y fecha local sin correr el día por la zona horaria", () => {
  const date = isoToLocalDate("2026-10-01");
  assert.deepEqual([date.getFullYear(), date.getMonth(), date.getDate()], [2026, 9, 1]);
  assert.equal(localDateToIso(date), "2026-10-01");
  assert.equal(localDateToIso(isoToLocalDate("2026-12-31")), "2026-12-31");
});

test("el rango solo se entrega cuando ya hay inicio y fin", () => {
  assert.equal(isoRangeFromDays(undefined), null);
  assert.equal(isoRangeFromDays({ from: isoToLocalDate("2026-10-01") }), null);
  assert.deepEqual(isoRangeFromDays({ from: isoToLocalDate("2026-10-01"), to: isoToLocalDate("2026-10-14") }), { start: "2026-10-01", end: "2026-10-14" });
});

test("el rango ISO se vuelve el rango del calendario y a la inversa", () => {
  assert.equal(dayRangeFromIso(null), undefined);
  assert.deepEqual(isoRangeFromDays(dayRangeFromIso({ start: "2026-09-29", end: "2026-10-13" })), { start: "2026-09-29", end: "2026-10-13" });
});
