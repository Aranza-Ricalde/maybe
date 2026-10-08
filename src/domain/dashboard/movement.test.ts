import assert from "node:assert/strict";
import { test } from "node:test";
import { lastDaysFlow } from "./movement";

const series = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"].map((key, index) => ({ key, incomeCents: index * 100, expenseCents: index * 10 }));

test("toma los últimos días hasta hoy y descarta los futuros", () => {
  assert.deepEqual(lastDaysFlow(series, "2026-10-03", 2).map((day) => day.date), ["2026-10-02", "2026-10-03"]);
  assert.equal(lastDaysFlow(series, "2026-10-04", 10).length, 4);
});
