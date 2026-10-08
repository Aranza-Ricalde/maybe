import assert from "node:assert/strict";
import { test } from "node:test";
import { OTHERS_KEY, budgetVsActualBars, donutSlices, stackedSpendingSeries } from "./charts";

const row = (categoryId: number, name: string, series: number[]) => ({
  categoryId,
  name,
  depth: 0 as const,
  parentId: null,
  seriesCents: series,
  count: 1,
  windowCents: series.reduce((a, b) => a + b, 0),
  avgLast3Cents: 0,
  lastMonthCents: 0,
  previousMonthCents: 0,
  deltaCents: 0,
  deltaPct: null,
  shareOfWindow: 0,
  discretionaryShare: 0,
});

test("el gasto apilado toma las categorías más grandes y agrupa el resto en Otras", () => {
  const stats = { months: ["2026-08-01", "2026-09-01"], rows: [row(1, "Casa", [100, 100]), row(2, "Comida", [50, 60]), row(3, "Ocio", [5, 5]), row(4, "Ropa", [1, 2])] };
  const result = stackedSpendingSeries(stats, 2);
  assert.deepEqual(result.keys.map((key) => key.label), ["Casa", "Comida", "Otras"]);
  assert.equal(result.data.length, 2);
  assert.equal(result.data[1][OTHERS_KEY], 7);
  assert.equal(result.data[0].c1, 100);
});

test("sin categorías de sobra no se crea la serie Otras", () => {
  const result = stackedSpendingSeries({ months: ["2026-09-01"], rows: [row(1, "Casa", [10])] }, 4);
  assert.deepEqual(result.keys.map((key) => key.key), ["c1"]);
});

test("presupuesto contra gasto: solo categorías principales con datos, marcando las que se pasaron", () => {
  const bars = budgetVsActualBars([
    { depth: 0, name: "Comida", effectiveBudgetedCents: 1000, actualCents: -1500 },
    { depth: 1, name: "Café", effectiveBudgetedCents: 100, actualCents: -50 },
    { depth: 0, name: "Ocio", effectiveBudgetedCents: 500, actualCents: -100 },
    { depth: 0, name: "Vacía", effectiveBudgetedCents: 0, actualCents: 0 },
  ]);
  assert.deepEqual(bars.map((bar) => [bar.name, bar.over]), [["Comida", true], ["Ocio", false]]);
});

test("la dona omite lo que no suma y usa el color de la categoría o de la paleta", () => {
  const slices = donutSlices([
    { key: "a", categoryId: 1, name: "A", color: "#ff0000", totalCents: 500, count: 1, share: 0.5 },
    { key: "b", categoryId: 2, name: "B", color: null, totalCents: 500, count: 1, share: 0.5 },
    { key: "c", categoryId: 3, name: "C", color: null, totalCents: 0, count: 0, share: 0 },
  ]);
  assert.deepEqual(slices.map((slice) => slice.fill), ["#ff0000", "var(--chart-2)"]);
});
