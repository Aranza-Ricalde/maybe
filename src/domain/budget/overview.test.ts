import assert from "node:assert/strict";
import { test } from "node:test";
import { budgetScopeNote, composeBudgetOverview, topLevelBudgetCards } from "./overview";

const PERIODS = [{ start: "2026-10-01", end: "2026-10-15", monthShare: 0.5 }];

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

test("budgetScopeNote: explica con claridad cuánto cuenta un presupuesto mensual según lo que se ve", () => {
  assert.match(budgetScopeNote(1, 2), /mes completo/);
  assert.match(budgetScopeNote(0.5, 1), /la mitad/);
  assert.match(budgetScopeNote(1.5, 3), /150%/);
});

import { budgetOriginOf } from "./overview";

const BASE = { manualAmountCents: 0, cadence: "monthly" as const, effectiveCents: 100_000, hasChildren: false, isDerivedFromChildren: false, isRaisedByChildren: false, ownCapCents: 0, unallocatedCents: 0 };

test("budgetOriginOf: distingue manual, recurrente, suma de hijas, tope con sobrante y tope que subió", () => {
  assert.deepEqual(budgetOriginOf({ ...BASE, effectiveCents: 0 }), { kind: "none" });
  assert.deepEqual(budgetOriginOf({ ...BASE, manualAmountCents: 45_000 }), { kind: "manual", amountCents: 45_000, cadence: "monthly" });
  assert.deepEqual(budgetOriginOf(BASE), { kind: "recurring" });
  assert.deepEqual(budgetOriginOf({ ...BASE, hasChildren: true, isDerivedFromChildren: true }), { kind: "children" });
  assert.deepEqual(budgetOriginOf({ ...BASE, hasChildren: true, manualAmountCents: 400_000, unallocatedCents: 70_000 }), { kind: "cap", amountCents: 400_000, cadence: "monthly", unallocatedCents: 70_000 });
  assert.deepEqual(budgetOriginOf({ ...BASE, hasChildren: true, manualAmountCents: 400_000, isRaisedByChildren: true, ownCapCents: 400_000 }), { kind: "raised", ownCapCents: 400_000 });
});

test("budgetTableRows: cada fila trae el origen del monto y la descripción (propia o sugerida)", () => {
  const categories = [
    { id: 1, name: "Vivienda", color: "#00f", parentId: null },
    { id: 2, name: "Renta", color: "#0ff", parentId: 1, description: "Lo que le pago al casero" },
    { id: 3, name: "Cosas raras", color: "#0ff", parentId: 1 },
  ];
  const settings = [{ categoryId: 2, cadence: "monthly" as const, budgetedAmountCents: 600_000 }];
  const overview = composeBudgetOverview({ categories, settings, recurringItems: [], periods: [{ start: "2026-10-01", end: "2026-10-31", monthShare: 1 }], actuals: [] });
  const rows = budgetTableRows(categories, settings, overview.hierarchy);
  const byName = new Map(rows.map((r) => [r.name, r]));
  assert.deepEqual(byName.get("Vivienda")?.origin, { kind: "children" });
  assert.equal(byName.get("Vivienda")?.description.isSuggested, true);
  assert.deepEqual(byName.get("Renta")?.origin, { kind: "manual", amountCents: 600_000, cadence: "monthly" });
  assert.deepEqual(byName.get("Renta")?.description, { text: "Lo que le pago al casero", isSuggested: false });
  assert.deepEqual(byName.get("Cosas raras")?.description, { text: null, isSuggested: false });
  assert.deepEqual(byName.get("Cosas raras")?.origin, { kind: "none" });
});

import { summarizeBudget } from "./overview";

test("el ahorro planeado no cuenta como presupuesto de gasto: ni la categoría ni sus hijas", () => {
  const categories = [
    { id: 1, parentId: null, spendingNature: null },
    { id: 2, parentId: null, spendingNature: "savings" as const },
    { id: 3, parentId: 2, spendingNature: null },
  ];
  const overview = composeBudgetOverview({
    categories,
    settings: [
      { categoryId: 1, cadence: "biweekly", budgetedAmountCents: 100_000 },
      { categoryId: 3, cadence: "biweekly", budgetedAmountCents: 240_000 },
    ],
    recurringItems: [],
    periods: PERIODS,
    actuals: [],
  });
  assert.equal(overview.totalCents, 100_000);
  const rows = budgetTableRows(
    categories.map((c) => ({ ...c, name: `c${c.id}`, color: "#000" })),
    [{ categoryId: 1, cadence: "biweekly", budgetedAmountCents: 100_000 }, { categoryId: 3, cadence: "biweekly", budgetedAmountCents: 240_000 }],
    overview.hierarchy,
  );
  assert.deepEqual(rows.map((row) => [row.categoryId, row.isSavings]), [[1, false], [2, true], [3, true]]);
  assert.equal(summarizeBudget(rows).budgetedCents, 100_000);
});
