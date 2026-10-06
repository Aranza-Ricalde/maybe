import assert from "node:assert/strict";
import { test } from "node:test";
import { composeBudgetOverview, topLevelBudgetCards } from "./overview";

const PERIODS = [{ start: "2026-10-01", end: "2026-10-15" }];

test("composeBudgetOverview: arma la jerarquía y el total con el presupuesto prorrateado y el gasto real", () => {
  const overview = composeBudgetOverview({
    categories: [{ id: 1, parentId: null }, { id: 2, parentId: null }],
    settings: [{ categoryId: 1, cadence: "biweekly", budgetedAmountCents: 100_000 }],
    recurringItems: [],
    periods: PERIODS,
    actuals: [{ categoryId: 1, totalCents: 40_000 }],
  });
  assert.equal(overview.totalCents, 100_000);
  assert.equal(overview.hierarchy.find((l) => l.categoryId === 1)?.actualCents, 40_000);
});

test("composeBudgetOverview: sin presupuestos el total es null", () => {
  const overview = composeBudgetOverview({ categories: [{ id: 1, parentId: null }], settings: [], recurringItems: [], periods: PERIODS, actuals: [] });
  assert.equal(overview.totalCents, null);
});

test("topLevelBudgetCards: solo categorías principales con presupuesto, con nombre y color", () => {
  const overview = composeBudgetOverview({
    categories: [{ id: 1, parentId: null }, { id: 2, parentId: null }],
    settings: [{ categoryId: 1, cadence: "biweekly", budgetedAmountCents: 50_000 }],
    recurringItems: [],
    periods: PERIODS,
    actuals: [],
  });
  const cards = topLevelBudgetCards(overview.hierarchy, [{ id: 1, name: "Comida", color: "#f00" }, { id: 2, name: "Ocio", color: null }]);
  assert.deepEqual(cards, [{ categoryId: 1, name: "Comida", color: "#f00", budgetedCents: 50_000, actualCents: 0 }]);
});

import { budgetTableRows } from "./overview";

test("budgetTableRows: ordena como árbol y completa los datos de presupuesto, gasto y reparto", () => {
  const categories = [
    { id: 1, name: "Vivienda", color: "#00f", parentId: null },
    { id: 2, name: "Renta", color: "#0ff", parentId: 1 },
    { id: 3, name: "Ocio", color: "#f0f", parentId: null },
  ];
  const settings = [{ categoryId: 3, cadence: "biweekly" as const, budgetedAmountCents: 40_000 }];
  const overview = composeBudgetOverview({ categories, settings, recurringItems: [], periods: PERIODS, actuals: [{ categoryId: 3, totalCents: 10_000 }] });
  const rows = budgetTableRows(categories, settings, overview.hierarchy);
  assert.deepEqual(rows.map((r) => [r.name, r.depth]), [["Ocio", 0], ["Vivienda", 0], ["Renta", 1]]);
  const ocio = rows[0];
  assert.equal(ocio.cadence, "biweekly");
  assert.equal(ocio.manualBudgetedAmountCents, 40_000);
  assert.equal(ocio.effectiveBudgetedCents, 40_000);
  assert.equal(ocio.actualCents, 10_000);
  assert.equal(rows[1].cadence, "monthly");
});
