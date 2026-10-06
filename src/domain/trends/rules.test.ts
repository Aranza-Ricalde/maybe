import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTrendSummary, type MonthlyTotal } from "./rules";

const m = (month: string, expenseCents: number): MonthlyTotal => ({ month, expenseCents });
const CURRENT = "2026-10-01";

test("compara el último mes completo con el mes anterior y el promedio de 3 meses", () => {
  const summary = buildTrendSummary([m("2026-06-01", 100_000), m("2026-07-01", 200_000), m("2026-08-01", 300_000), m("2026-09-01", 400_000)], CURRENT)!;
  assert.equal(summary.month, "2026-09-01");
  assert.equal(summary.lastCents, 400_000);
  const byKey = Object.fromEntries(summary.comparisons.map((c) => [c.key, c]));
  assert.equal(byKey.previousMonth.baselineCents, 300_000);
  assert.equal(byKey.previousMonth.deltaCents, 100_000);
  assert.equal(byKey.avg3.baselineCents, 200_000);
  assert.equal(byKey.avg3.deltaCents, 200_000);
  assert.equal(byKey.avg3.deltaPct, 1);
  assert.equal(byKey.avg3.monthsUsed, 3);
});

test("el ejemplo de principios.md: Transporte +21 % respecto al promedio de 3 meses", () => {
  const summary = buildTrendSummary([m("2026-06-01", 100_000), m("2026-07-01", 100_000), m("2026-08-01", 100_000), m("2026-09-01", 121_000)], CURRENT)!;
  assert.equal(Math.round((summary.comparisons.find((c) => c.key === "avg3")?.deltaPct ?? 0) * 100), 21);
});

test("el promedio de 6 meses solo aparece si hay suficientes meses y aporta algo distinto al de 3", () => {
  const four = buildTrendSummary([m("2026-05-01", 100), m("2026-06-01", 100), m("2026-07-01", 100), m("2026-08-01", 100), m("2026-09-01", 100)], CURRENT)!;
  assert.deepEqual(four.comparisons.map((c) => c.key), ["previousMonth", "avg3", "avg6"]);
  assert.equal(four.comparisons[2].monthsUsed, 4);
  const three = buildTrendSummary([m("2026-06-01", 100), m("2026-07-01", 100), m("2026-08-01", 100), m("2026-09-01", 100)], CURRENT)!;
  assert.deepEqual(three.comparisons.map((c) => c.key), ["previousMonth", "avg3"]);
});

test("el mismo mes del año anterior solo cuando existe", () => {
  const withYear = buildTrendSummary([m("2025-09-01", 500_000), m("2026-08-01", 300_000), m("2026-09-01", 400_000)], CURRENT)!;
  const year = withYear.comparisons.find((c) => c.key === "yearAgo")!;
  assert.equal(year.baselineCents, 500_000);
  assert.equal(year.deltaCents, -100_000);
  assert.equal(buildTrendSummary([m("2026-08-01", 300_000), m("2026-09-01", 400_000)], CURRENT)!.comparisons.some((c) => c.key === "yearAgo"), false);
});

test("un mes sin datos no cuenta como mes sin gasto: se omite, y con un solo mes de referencia no hay promedio", () => {
  assert.equal(buildTrendSummary([m("2026-07-01", 300_000), m("2026-09-01", 400_000)], CURRENT), null);
  const summary = buildTrendSummary([m("2026-06-01", 100_000), m("2026-07-01", 300_000), m("2026-09-01", 400_000)], CURRENT)!;
  assert.equal(summary.comparisons.some((c) => c.key === "previousMonth"), false);
  const avg3 = summary.comparisons.find((c) => c.key === "avg3")!;
  assert.equal(avg3.monthsUsed, 2);
  assert.equal(avg3.baselineCents, 200_000);
});

test("el mes en curso nunca se compara y sin el último mes completo no hay resumen", () => {
  assert.equal(buildTrendSummary([m("2026-10-01", 999_999), m("2026-08-01", 100)], CURRENT), null);
  assert.equal(buildTrendSummary([], CURRENT), null);
  assert.equal(buildTrendSummary([m("2026-09-01", 400_000)], CURRENT), null); // sin nada con qué compararlo
});

test("con referencia en cero no se calcula el porcentaje", () => {
  const summary = buildTrendSummary([m("2026-08-01", 0), m("2026-09-01", 400_000)], CURRENT);
  assert.equal(summary, null);
});
