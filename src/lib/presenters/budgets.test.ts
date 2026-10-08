import assert from "node:assert/strict";
import { test } from "node:test";
import { budgetLineStatus, budgetSummaryView, coverageProgress, groupBudgetRows } from "./budgets";

const row = (categoryId: number, parentId: number | null, effectiveBudgetedCents: number) => ({ categoryId, parentId, hasChildren: false, effectiveBudgetedCents, actualCents: 0 });

test("sin presupuesto no hay porcentaje, tono ni barra", () => {
  assert.deepEqual(budgetLineStatus(0, -5000), { ratio: null, ringPercent: 0, barValue: 0, tone: null, over: false, leftCents: -5000 });
});

test("la barra se topa en 100 y se marca el exceso", () => {
  const status = budgetLineStatus(10000, -15000);
  assert.equal(status.ringPercent, 150);
  assert.equal(status.barValue, 100);
  assert.equal(status.tone, "danger");
  assert.equal(status.over, true);
  assert.equal(status.leftCents, -5000);
});

test("cerca del límite avisa en ámbar y dentro del presupuesto en verde", () => {
  assert.equal(budgetLineStatus(10000, -8500).tone, "warning");
  assert.equal(budgetLineStatus(10000, -2000).tone, "success");
});

test("agrupa en con y sin presupuesto y entrega las hijas de cada padre", () => {
  const groups = groupBudgetRows([row(1, null, 0), row(2, null, 500), row(3, 2, 100)]);
  assert.deepEqual(groups.budgeted.map((r) => r.categoryId), [2]);
  assert.deepEqual(groups.unbudgeted.map((r) => r.categoryId), [1]);
  assert.deepEqual(groups.childrenOf(2).map((r) => r.categoryId), [3]);
  assert.deepEqual(groups.childrenOf(1), []);
});

test("el resumen calcula lo que queda y marca cuando se pasó", () => {
  assert.deepEqual(budgetSummaryView(10000, 12500), { ringPercent: 125, remainingCents: -2500, over: true });
  assert.deepEqual(budgetSummaryView(0, 0), { ringPercent: 0, remainingCents: 0, over: false });
});

test("la cobertura del fondo se topa en 100 y tolera meta cero", () => {
  assert.equal(coverageProgress(1.5, 3), 50);
  assert.equal(coverageProgress(9, 3), 100);
  assert.equal(coverageProgress(2, 0), 0);
});
