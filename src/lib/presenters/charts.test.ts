import assert from "node:assert/strict";
import { test } from "node:test";
import { budgetVsActualBars } from "./charts";

test("presupuesto contra gasto: solo categorías principales con datos, marcando las que se pasaron", () => {
  const bars = budgetVsActualBars([
    { depth: 0, name: "Comida", effectiveBudgetedCents: 1000, actualCents: -1500 },
    { depth: 1, name: "Café", effectiveBudgetedCents: 100, actualCents: -50 },
    { depth: 0, name: "Ocio", effectiveBudgetedCents: 500, actualCents: -100 },
    { depth: 0, name: "Vacía", effectiveBudgetedCents: 0, actualCents: 0 },
  ]);
  assert.deepEqual(bars.map((bar) => [bar.name, bar.over]), [["Comida", true], ["Ocio", false]]);
});

import { goalRings } from "./charts";

test("los anillos de metas limitan el avance a 100% y omiten metas sin objetivo", () => {
  const rings = goalRings([
    { id: 1, name: "Viaje", currentCents: 25000, targetAmountCents: 100000 },
    { id: 2, name: "Fondo", currentCents: 300000, targetAmountCents: 100000 },
    { id: 3, name: "Sin meta", currentCents: 10, targetAmountCents: 0 },
    { id: 4, name: "Negativa", currentCents: -500, targetAmountCents: 1000 },
  ]);
  assert.deepEqual(rings.map((ring) => [ring.name, ring.percent]), [["Viaje", 25], ["Fondo", 100], ["Negativa", 0]]);
});
