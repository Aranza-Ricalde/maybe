import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertValidBudgetedAmountCents,
  classifyBudgetProgress,
  composeEffectiveBudgets,
  computeBudgetPercent,
  effectiveBudgetTargetCents,
  InvalidBudgetError,
  recurringContributionsByCategory,
  topCategoryBudgets,
} from "./rules";

test("effectiveBudgetTargetCents: quincenal escala con el número de periodos en vista", () => {
  assert.equal(effectiveBudgetTargetCents("biweekly", 150_000, 1), 150_000);
  assert.equal(effectiveBudgetTargetCents("biweekly", 150_000, 2), 300_000);
});

test("effectiveBudgetTargetCents: mensual no escala sin importar cuántos periodos se vean", () => {
  assert.equal(effectiveBudgetTargetCents("monthly", 600_000, 1), 600_000);
  assert.equal(effectiveBudgetTargetCents("monthly", 600_000, 2), 600_000);
});

test("recurringContributionsByCategory: suma el recurrente cuando su día cae en el periodo en vista", () => {
  const totals = recurringContributionsByCategory(
    [{ categoryId: 51, dayOfMonth: 15, estimatedAmountCents: -600_000, flow: "expense", status: "active" }],
    [{ start: "2026-10-14", end: "2026-10-29" }],
  );
  assert.equal(totals.get(51), 600_000);
});

test("recurringContributionsByCategory: no suma si el día no cae en ninguno de los periodos en vista", () => {
  const totals = recurringContributionsByCategory(
    [{ categoryId: 51, dayOfMonth: 15, estimatedAmountCents: -600_000, flow: "expense", status: "active" }],
    [{ start: "2026-09-29", end: "2026-10-13" }],
  );
  assert.equal(totals.has(51), false);
});

test("recurringContributionsByCategory: suma una vez por cada mes representado al ver varios periodos juntos", () => {
  const totals = recurringContributionsByCategory(
    [{ categoryId: 51, dayOfMonth: 15, estimatedAmountCents: -600_000, flow: "expense", status: "active" }],
    [
      { start: "2026-09-14", end: "2026-09-28" },
      { start: "2026-09-29", end: "2026-10-13" },
      { start: "2026-10-14", end: "2026-10-29" },
    ],
  );
  assert.equal(totals.get(51), 1_200_000);
});

test("recurringContributionsByCategory: ignora pausados, de ingreso, y sin categoría", () => {
  const totals = recurringContributionsByCategory(
    [
      { categoryId: 51, dayOfMonth: 15, estimatedAmountCents: -600_000, flow: "expense", status: "paused" },
      { categoryId: 38, dayOfMonth: 15, estimatedAmountCents: 2_000_000, flow: "income", status: "active" },
      { categoryId: null, dayOfMonth: 15, estimatedAmountCents: -100_000, flow: "expense", status: "active" },
    ],
    [{ start: "2026-10-14", end: "2026-10-29" }],
  );
  assert.equal(totals.size, 0);
});

test("computeBudgetPercent: null si no hay presupuesto asignado", () => {
  assert.equal(computeBudgetPercent(0, -50_000), null);
});

test("computeBudgetPercent: abs(actualCents) / budgetedCents", () => {
  assert.equal(computeBudgetPercent(100_000, -120_000), 1.2);
  assert.equal(computeBudgetPercent(200_000, -50_000), 0.25);
});

test("classifyBudgetProgress: success por debajo de 80%, warning de 80-100%, danger sobre 100%", () => {
  assert.equal(classifyBudgetProgress(0.5), "success");
  assert.equal(classifyBudgetProgress(0.8), "warning");
  assert.equal(classifyBudgetProgress(0.99), "warning");
  assert.equal(classifyBudgetProgress(1.01), "danger");
});

test("topCategoryBudgets: ignora categorías sin presupuesto asignado", () => {
  const result = topCategoryBudgets(
    [
      { categoryId: 1, name: "Despensa", color: "#000", budgetedCents: 0, actualCents: -500_000 },
      { categoryId: 2, name: "Ocio", color: "#111", budgetedCents: 100_000, actualCents: -50_000 },
    ],
    5,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Ocio");
});

test("topCategoryBudgets: las categorías sobre el límite van primero, sin importar el monto", () => {
  const result = topCategoryBudgets(
    [
      { categoryId: 1, name: "Transporte", color: "#000", budgetedCents: 150_000, actualCents: -140_000 },
      { categoryId: 2, name: "Ocio", color: "#111", budgetedCents: 100_000, actualCents: -120_000 },
    ],
    5,
  );
  assert.equal(result[0].name, "Ocio");
  assert.equal(result[0].isOverBudget, true);
  assert.equal(result[1].name, "Transporte");
  assert.equal(result[1].isOverBudget, false);
});

test("topCategoryBudgets: entre dos que no exceden, va primero la más cercana al límite", () => {
  const result = topCategoryBudgets(
    [
      { categoryId: 1, name: "Servicios", color: "#000", budgetedCents: 100_000, actualCents: -85_000 },
      { categoryId: 2, name: "Despensa", color: "#111", budgetedCents: 300_000, actualCents: -246_000 },
    ],
    5,
  );
  assert.equal(result[0].name, "Servicios");
  assert.equal(result[1].name, "Despensa");
});

test("topCategoryBudgets: respeta el límite de cuántas devuelve", () => {
  const result = topCategoryBudgets(
    [
      { categoryId: 1, name: "A", color: "#000", budgetedCents: 100_000, actualCents: -10_000 },
      { categoryId: 2, name: "B", color: "#000", budgetedCents: 100_000, actualCents: -20_000 },
      { categoryId: 3, name: "C", color: "#000", budgetedCents: 100_000, actualCents: -30_000 },
    ],
    2,
  );
  assert.equal(result.length, 2);
});

test("topCategoryBudgets: calcula spentCents y percent correctamente", () => {
  const result = topCategoryBudgets(
    [{ categoryId: 1, name: "Ocio", color: "#000", budgetedCents: 100_000, actualCents: -120_000 }],
    5,
  );
  assert.equal(result[0].spentCents, 120_000);
  assert.equal(result[0].percent, 1.2);
});

test("topCategoryBudgets: deviationCents es positivo cuando se excede el presupuesto (por encima)", () => {
  const result = topCategoryBudgets(
    [{ categoryId: 1, name: "Comida", color: "#000", budgetedCents: 300_000, actualCents: -360_000 }],
    5,
  );
  assert.equal(result[0].deviationCents, 60_000);
});

test("topCategoryBudgets: deviationCents es negativo cuando queda disponible (por debajo del presupuesto)", () => {
  const result = topCategoryBudgets(
    [{ categoryId: 1, name: "Transporte", color: "#000", budgetedCents: 200_000, actualCents: -150_000 }],
    5,
  );
  assert.equal(result[0].deviationCents, -50_000);
});

test("assertValidBudgetedAmountCents: rechaza 0 o negativo", () => {
  assert.throws(() => assertValidBudgetedAmountCents(0), InvalidBudgetError);
  assert.throws(() => assertValidBudgetedAmountCents(-100), InvalidBudgetError);
});

test("assertValidBudgetedAmountCents: acepta un monto positivo", () => {
  assert.doesNotThrow(() => assertValidBudgetedAmountCents(50_000));
});

test("composeEffectiveBudgets: combina presupuesto manual quincenal escalado + recurrente de otra categoría", () => {
  const result = composeEffectiveBudgets(
    [{ categoryId: 56, cadence: "biweekly", budgetedAmountCents: 150_000 }],
    [{ categoryId: 51, dayOfMonth: 15, estimatedAmountCents: -600_000, flow: "expense", status: "active" }],
    [
      { start: "2026-09-29", end: "2026-10-13" },
      { start: "2026-10-14", end: "2026-10-29" },
    ],
  );
  const despensa = result.find((r) => r.categoryId === 56);
  const renta = result.find((r) => r.categoryId === 51);
  assert.equal(despensa?.targetCents, 300_000);
  assert.equal(renta?.targetCents, 600_000);
});

test("composeEffectiveBudgets: suma presupuesto manual mensual + recurrente de la MISMA categoría", () => {
  const result = composeEffectiveBudgets(
    [{ categoryId: 51, cadence: "monthly", budgetedAmountCents: 500_000 }],
    [{ categoryId: 51, dayOfMonth: 15, estimatedAmountCents: -600_000, flow: "expense", status: "active" }],
    [{ start: "2026-10-14", end: "2026-10-29" }],
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].targetCents, 1_100_000);
});
