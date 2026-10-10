import assert from "node:assert/strict";
import { test } from "node:test";
import { activeQuickRange, quickRange } from "./dateRanges";

test("los rangos rápidos salen de la fecha de hoy", () => {
  assert.deepEqual(quickRange("today", "2026-10-08"), { start: "2026-10-08", end: "2026-10-08" });
  assert.deepEqual(quickRange("week", "2026-10-08"), { start: "2026-10-02", end: "2026-10-08" });
  assert.deepEqual(quickRange("month", "2026-10-08"), { start: "2026-10-01", end: "2026-10-08" });
  assert.deepEqual(quickRange("all", "2026-10-08"), { start: null, end: null });
});

test("se reconoce qué chip está activo y un rango a mano no activa ninguno", () => {
  assert.equal(activeQuickRange({ start: "2026-10-01", end: "2026-10-08" }, "2026-10-08"), "month");
  assert.equal(activeQuickRange({ start: null, end: null }, "2026-10-08"), "all");
  assert.equal(activeQuickRange({ start: "2026-09-01", end: "2026-09-30" }, "2026-10-08"), "");
});
