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

const Q1 = { start: "2026-09-29", end: "2026-10-14" };
const Q2 = { start: "2026-10-15", end: "2026-10-28" };
const OCTUBRE = [{ start: "2026-10-01", end: "2026-10-15" }, { start: "2026-10-16", end: "2026-10-31" }];

test("effectiveBudgetTargetCents: quincenal escala con el número de periodos en vista", () => {
  assert.equal(effectiveBudgetTargetCents("biweekly", 150_000, [Q1]), 150_000);
  assert.equal(effectiveBudgetTargetCents("biweekly", 150_000, [Q1, Q2]), 300_000);
});

test("effectiveBudgetTargetCents: mensual se prorratea: un mes completo da el monto y media quincena su parte", () => {
  assert.equal(effectiveBudgetTargetCents("monthly", 600_000, OCTUBRE), 600_000);
  assert.equal(effectiveBudgetTargetCents("monthly", 310_000, [{ start: "2026-10-01", end: "2026-10-15" }]), 150_000);
});

test("effectiveBudgetTargetCents: mensual no cuenta dos veces los días de periodos traslapados", () => {
  assert.equal(effectiveBudgetTargetCents("monthly", 600_000, [...OCTUBRE, { start: "2026-10-10", end: "2026-10-20" }]), 600_000);
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
  // 16 de 31 días de octubre del presupuesto mensual (500,000 × 16/31) + la renta completa que cae en el periodo.
  assert.equal(result[0].targetCents, Math.round((500_000 * 16) / 31) + 600_000);
});

import { rollUpBudgetHierarchy, totalBudgetedCents } from "./rules";

const VIVIENDA_TREE = [
  { id: 43, parentId: null },
  { id: 51, parentId: 43 },
  { id: 53, parentId: 43 },
  { id: 54, parentId: 43 },
  { id: 42, parentId: null },
];

function line(lines: ReturnType<typeof rollUpBudgetHierarchy>, id: number) {
  const found = lines.find((l) => l.categoryId === id);
  assert.ok(found, `falta la línea ${id}`);
  return found;
}

test("rollUpBudgetHierarchy: la madre con presupuesto propio es el tope y las hijas no se suman al total", () => {
  const lines = rollUpBudgetHierarchy({
    categories: VIVIENDA_TREE,
    effectiveTargets: new Map([[43, 400000], [51, 150000], [53, 100000], [54, 80000], [42, 300000]]),
    manualCategoryIds: new Set([43, 51, 53, 54, 42]),
    actuals: new Map(),
  });
  assert.equal(line(lines, 43).targetCents, 400000);
  assert.equal(line(lines, 43).childrenAllocatedCents, 330000);
  assert.equal(line(lines, 43).isOverAllocated, false);
  assert.equal(totalBudgetedCents(lines), 700000);
});

test("rollUpBudgetHierarchy: avisa cuando las subcategorías suman más que el tope de la madre, sin corregirlo", () => {
  const lines = rollUpBudgetHierarchy({
    categories: VIVIENDA_TREE,
    effectiveTargets: new Map([[43, 400000], [51, 400000], [53, 160000], [54, 80000]]),
    manualCategoryIds: new Set([43, 51, 53, 54]),
    actuals: new Map(),
  });
  assert.equal(line(lines, 43).targetCents, 400000);
  assert.equal(line(lines, 43).childrenAllocatedCents, 640000);
  assert.equal(line(lines, 43).isOverAllocated, true);
});

test("rollUpBudgetHierarchy: una madre sin presupuesto propio vale la suma de sus subcategorías", () => {
  const lines = rollUpBudgetHierarchy({
    categories: [{ id: 60, parentId: null }, { id: 47, parentId: 60 }, { id: 48, parentId: 60 }],
    effectiveTargets: new Map([[47, 1150000], [48, 1250000]]),
    manualCategoryIds: new Set([47, 48]),
    actuals: new Map(),
  });
  assert.equal(line(lines, 60).targetCents, 2400000);
  assert.equal(line(lines, 60).isDerivedFromChildren, true);
  assert.equal(line(lines, 60).isOverAllocated, false);
  assert.equal(totalBudgetedCents(lines), 2400000);
});

test("rollUpBudgetHierarchy: el gasto de la madre incluye el de sus hijas; el de la hija es solo el suyo", () => {
  const lines = rollUpBudgetHierarchy({
    categories: VIVIENDA_TREE,
    effectiveTargets: new Map([[43, 400000]]),
    manualCategoryIds: new Set([43]),
    actuals: new Map([[43, -10000], [51, -300000], [54, -50000], [42, -7000]]),
  });
  assert.equal(line(lines, 43).actualCents, -360000);
  assert.equal(line(lines, 51).actualCents, -300000);
  assert.equal(line(lines, 42).actualCents, -7000);
});

test("rollUpBudgetHierarchy: sin jerarquía se comporta como antes (cada categoría por separado)", () => {
  const lines = rollUpBudgetHierarchy({
    categories: [{ id: 1, parentId: null }, { id: 2, parentId: null }],
    effectiveTargets: new Map([[1, 100], [2, 200]]),
    manualCategoryIds: new Set([1, 2]),
    actuals: new Map([[1, -50]]),
  });
  assert.equal(line(lines, 1).targetCents, 100);
  assert.equal(line(lines, 1).actualCents, -50);
  assert.equal(totalBudgetedCents(lines), 300);
});

test("rollUpBudgetHierarchy: una hija cuya madre no está en la lista se trata como principal y cuenta en el total", () => {
  const lines = rollUpBudgetHierarchy({
    categories: [{ id: 5, parentId: 99 }],
    effectiveTargets: new Map([[5, 700]]),
    manualCategoryIds: new Set([5]),
    actuals: new Map(),
  });
  assert.equal(line(lines, 5).parentId, null);
  assert.equal(totalBudgetedCents(lines), 700);
});

test("rollUpBudgetHierarchy: un recurrente sin línea manual en la madre suma a su tope derivado junto con las hijas", () => {
  const lines = rollUpBudgetHierarchy({
    categories: [{ id: 43, parentId: null }, { id: 51, parentId: 43 }],
    effectiveTargets: new Map([[43, 60000], [51, 400000]]),
    manualCategoryIds: new Set([51]),
    actuals: new Map(),
  });
  assert.equal(line(lines, 43).targetCents, 460000);
});

test("totalBudgetedCents: sin ningún presupuesto devuelve null", () => {
  assert.equal(totalBudgetedCents(rollUpBudgetHierarchy({ categories: [{ id: 1, parentId: null }], effectiveTargets: new Map(), manualCategoryIds: new Set(), actuals: new Map() })), null);
});

import { assertValidBudgetCadence } from "./rules";

test("assertValidBudgetCadence: acepta monthly y biweekly, rechaza otras", () => {
  assert.doesNotThrow(() => assertValidBudgetCadence("monthly"));
  assert.doesNotThrow(() => assertValidBudgetCadence("biweekly"));
  assert.throws(() => assertValidBudgetCadence("weekly"), InvalidBudgetError);
});

test("un recurrente que el usuario sacó del presupuesto no suma; sin decisión o incluido sí", () => {
  const period = [{ start: "2026-10-01", end: "2026-10-31" }];
  const base = { categoryId: 7, dayOfMonth: 10, estimatedAmountCents: -50_000, flow: "expense" as const, status: "active" as const };
  const totals = recurringContributionsByCategory(
    [{ ...base, budgetInclusion: "excluded" }, { ...base, budgetInclusion: null }, { ...base, budgetInclusion: "included" }, { ...base }],
    period,
  );
  assert.equal(totals.get(7), 150_000);
});
