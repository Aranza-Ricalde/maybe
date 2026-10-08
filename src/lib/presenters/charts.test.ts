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

import { goalRings, waterfallSteps } from "./charts";

test("los anillos de metas limitan el avance a 100% y omiten metas sin objetivo", () => {
  const rings = goalRings([
    { id: 1, name: "Viaje", currentCents: 25000, targetAmountCents: 100000 },
    { id: 2, name: "Fondo", currentCents: 300000, targetAmountCents: 100000 },
    { id: 3, name: "Sin meta", currentCents: 10, targetAmountCents: 0 },
    { id: 4, name: "Negativa", currentCents: -500, targetAmountCents: 1000 },
  ]);
  assert.deepEqual(rings.map((ring) => [ring.name, ring.percent]), [["Viaje", 25], ["Fondo", 100], ["Negativa", 0]]);
});

test("la cascada parte del periodo anterior, suma cada cambio y llega al periodo actual con 'Otros' para lo no explicado", () => {
  const steps = waterfallSteps({ previousCents: 1000, currentCents: 1600, drivers: [{ name: "Comida", deltaCents: 500 }, { name: "Ocio", deltaCents: -200 }] });
  assert.deepEqual(steps.map((step) => [step.label, step.kind, step.base, step.value]), [
    ["Periodo anterior", "total", 0, 1000],
    ["Comida", "increase", 1000, 500],
    ["Ocio", "decrease", 1300, 200],
    ["Otros", "increase", 1300, 300],
    ["Este periodo", "total", 0, 1600],
  ]);
});

test("si los cambios explican todo no aparece 'Otros'", () => {
  const steps = waterfallSteps({ previousCents: 1000, currentCents: 1500, drivers: [{ name: "Comida", deltaCents: 500 }] });
  assert.equal(steps.some((step) => step.label === "Otros"), false);
});
