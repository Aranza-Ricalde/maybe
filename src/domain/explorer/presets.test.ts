import assert from "node:assert/strict";
import { test } from "node:test";
import { resolvePreset } from "./presets";

const TODAY = "2026-10-06";

test("30 días incluye hoy y los 29 anteriores", () => {
  assert.deepEqual(resolvePreset("30d", TODAY, null, null), { from: "2026-09-07", to: "2026-10-06" });
});

test("3, 6 y 12 meses arrancan en el día 1 del mes correspondiente y llegan hasta hoy", () => {
  assert.deepEqual(resolvePreset("3m", TODAY, null, null), { from: "2026-08-01", to: TODAY });
  assert.deepEqual(resolvePreset("6m", TODAY, null, null), { from: "2026-05-01", to: TODAY });
  assert.deepEqual(resolvePreset("12m", TODAY, null, null), { from: "2025-11-01", to: TODAY });
});

test("el periodo actual usa el periodo de pago y, si no hay, cae a 30 días", () => {
  assert.deepEqual(resolvePreset("period", TODAY, { from: "2026-09-29", to: "2026-10-13" }, null), { from: "2026-09-29", to: "2026-10-13" });
  assert.deepEqual(resolvePreset("period", TODAY, null, null), { from: "2026-09-07", to: TODAY });
});

test("fechas personalizadas respeta el rango elegido", () => {
  assert.deepEqual(resolvePreset("custom", TODAY, null, { from: "2026-01-01", to: "2026-01-31" }), { from: "2026-01-01", to: "2026-01-31" });
});

test("ningún preset supera el máximo de días del explorador", () => {
  const range = resolvePreset("12m", "2026-12-31", null, null);
  const days = (Date.parse(`${range.to}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86_400_000 + 1;
  assert.ok(days <= 400);
});
