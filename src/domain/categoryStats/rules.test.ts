import assert from "node:assert/strict";
import { test } from "node:test";
import { UNCATEGORIZED_ID, UNKNOWN_CATEGORY_ID, buildCategoryStats, statMonths, type MonthlyCategorySpend, type StatCategory } from "./rules";

const TODAY = "2026-10-12";
const CATEGORIES: StatCategory[] = [
  { id: 43, name: "Vivienda", parentId: null },
  { id: 51, name: "Renta", parentId: 43 },
  { id: 53, name: "Mantenimiento", parentId: 43 },
  { id: 61, name: "Despensa", parentId: null },
  { id: 62, name: "Restaurantes", parentId: null },
];

function spend(categoryId: number | null, month: string, spentCents: number, count = 1): MonthlyCategorySpend {
  return { categoryId, month, spentCents, count };
}

test("statMonths: los últimos 6 meses, del más viejo al mes en curso", () => {
  assert.deepEqual(statMonths(TODAY), ["2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01", "2026-10-01"]);
});

test("una categoría principal suma a sus subcategorías y estas se listan debajo, sin sumarse dos veces al total", () => {
  const stats = buildCategoryStats({
    categories: CATEGORIES,
    today: TODAY,
    spend: [spend(43, "2026-09-01", 1_000), spend(51, "2026-09-01", 6_000), spend(53, "2026-09-01", 2_000), spend(61, "2026-09-01", 3_000)],
  });
  const vivienda = stats.rows.find((r) => r.name === "Vivienda")!;
  assert.equal(vivienda.depth, 0);
  assert.equal(vivienda.lastMonthCents, 9_000);
  assert.deepEqual(stats.rows.filter((r) => r.parentId === 43).map((r) => `${r.name}:${r.lastMonthCents}`), ["Renta:6000", "Mantenimiento:2000"]);
  assert.equal(stats.totals.lastMonthCents, 12_000);
  assert.equal(stats.rows.filter((r) => r.depth === 0).reduce((s, r) => s + r.lastMonthCents, 0), stats.totals.lastMonthCents);
});

test("el mes en curso se muestra pero no entra en promedios ni en la comparación con el mes anterior", () => {
  const stats = buildCategoryStats({
    categories: CATEGORIES,
    today: TODAY,
    spend: [spend(61, "2026-07-01", 1_000), spend(61, "2026-08-01", 2_000), spend(61, "2026-09-01", 3_000), spend(61, "2026-10-01", 99_000)],
  });
  const despensa = stats.rows.find((r) => r.name === "Despensa")!;
  assert.equal(despensa.seriesCents[5], 99_000);
  assert.equal(despensa.lastMonthCents, 3_000);
  assert.equal(despensa.previousMonthCents, 2_000);
  assert.equal(despensa.deltaCents, 1_000);
  assert.equal(despensa.deltaPct, 0.5);
  assert.equal(despensa.avgLast3Cents, 2_000);
  assert.equal(despensa.windowCents, 6_000);
});

test("los meses anteriores al primer gasto no cuentan como 'mes sin gasto' y no bajan el promedio", () => {
  const stats = buildCategoryStats({
    categories: CATEGORIES,
    today: TODAY,
    spend: [spend(62, "2026-08-01", 6_000), spend(62, "2026-09-01", 9_000)],
  });
  assert.deepEqual(stats.completedMonths, ["2026-08-01", "2026-09-01"]);
  assert.equal(stats.rows[0].avgLast3Cents, 7_500);
});

test("sin gasto el mes anterior no hay base de comparación: el porcentaje es null (no infinito)", () => {
  const stats = buildCategoryStats({
    categories: CATEGORIES,
    today: TODAY,
    spend: [spend(61, "2026-08-01", 1_000), spend(62, "2026-08-01", 500), spend(62, "2026-09-01", 4_000)],
  });
  const restaurantes = stats.rows.find((r) => r.name === "Restaurantes")!;
  assert.equal(restaurantes.deltaPct, 7);
  const despensa = stats.rows.find((r) => r.name === "Despensa")!;
  assert.equal(despensa.lastMonthCents, 0);
  assert.equal(despensa.deltaCents, -1_000);
  assert.equal(despensa.deltaPct, -1);
  const nuevo = buildCategoryStats({ categories: CATEGORIES, today: TODAY, spend: [spend(61, "2026-08-01", 100), spend(62, "2026-09-01", 4_000)] });
  assert.equal(nuevo.rows.find((r) => r.name === "Restaurantes")!.deltaPct, null);
});

test("el gasto sin categoría y el de categorías borradas aparecen como filas propias: nada se pierde", () => {
  const stats = buildCategoryStats({
    categories: CATEGORIES,
    today: TODAY,
    spend: [spend(null, "2026-09-01", 700, 3), spend(999, "2026-09-01", 300), spend(61, "2026-09-01", 1_000)],
  });
  assert.equal(stats.rows.find((r) => r.categoryId === UNCATEGORIZED_ID)?.name, "Sin categoría");
  assert.equal(stats.rows.find((r) => r.categoryId === UNKNOWN_CATEGORY_ID)?.name, "Otro");
  assert.equal(stats.totals.lastMonthCents, 2_000);
});

test("el porcentaje del gasto se calcula sobre el total de la ventana y las principales suman 100 %", () => {
  const stats = buildCategoryStats({
    categories: CATEGORIES,
    today: TODAY,
    spend: [spend(61, "2026-08-01", 1_000), spend(61, "2026-09-01", 1_000), spend(62, "2026-08-01", 3_000), spend(62, "2026-09-01", 3_000)],
  });
  const principals = stats.rows.filter((r) => r.depth === 0);
  assert.equal(principals.reduce((s, r) => s + r.shareOfWindow, 0), 1);
  assert.equal(stats.rows.find((r) => r.name === "Restaurantes")!.shareOfWindow, 0.75);
});

test("ordena por gasto de la ventana (la categoría que más pesa primero) y oculta las que no tienen gasto", () => {
  const stats = buildCategoryStats({
    categories: CATEGORIES,
    today: TODAY,
    spend: [spend(61, "2026-09-01", 1_000), spend(62, "2026-09-01", 5_000)],
  });
  assert.deepEqual(stats.rows.map((r) => r.name), ["Restaurantes", "Despensa"]);
});

test("los movimientos del mes en curso no se cuentan en la ventana; el gasto de meses fuera de la ventana se ignora", () => {
  const stats = buildCategoryStats({
    categories: CATEGORIES,
    today: TODAY,
    spend: [spend(61, "2026-09-01", 1_000, 4), spend(61, "2026-10-01", 500, 9), spend(61, "2025-01-01", 7_000, 2)],
  });
  const despensa = stats.rows.find((r) => r.name === "Despensa")!;
  assert.equal(despensa.count, 4);
  assert.equal(despensa.windowCents, 1_000);
});

test("sin ningún gasto no revienta: filas vacías y totales en cero", () => {
  const stats = buildCategoryStats({ categories: CATEGORIES, today: TODAY, spend: [] });
  assert.equal(stats.rows.length, 0);
  assert.equal(stats.totals.windowCents, 0);
  assert.equal(stats.totals.deltaPct, null);
});

test("esencial vs. discrecional: una subcategoría hereda de su madre o usa la suya, y lo sin clasificar no se esconde", () => {
  const categories: StatCategory[] = [
    { id: 43, name: "Vivienda", parentId: null, nature: "essential" },
    { id: 51, name: "Renta", parentId: 43, nature: null },
    { id: 53, name: "Decoración", parentId: 43, nature: "discretionary" },
    { id: 61, name: "Despensa", parentId: null, nature: "essential" },
    { id: 62, name: "Restaurantes", parentId: null, nature: "discretionary" },
    { id: 70, name: "Varios", parentId: null, nature: null },
  ];
  const stats = buildCategoryStats({
    categories,
    today: TODAY,
    spend: [
      spend(51, "2026-09-01", 6_000), // hereda esencial
      spend(53, "2026-09-01", 1_000), // propia: discrecional
      spend(61, "2026-09-01", 3_000),
      spend(62, "2026-09-01", 2_000),
      spend(70, "2026-09-01", 500), // sin clasificar
      spend(null, "2026-09-01", 400), // sin categoría: sin clasificar
    ],
  });
  const of = (nature: string | null) => stats.natures.find((n) => n.nature === nature)!;
  assert.equal(of("essential").windowCents, 9_000);
  assert.equal(of("discretionary").windowCents, 3_000);
  assert.equal(of(null).windowCents, 900);
  assert.equal(stats.natures.reduce((s, n) => s + n.windowCents, 0), stats.totals.windowCents);
  assert.equal(Math.round(stats.natures.reduce((s, n) => s + n.shareOfWindow, 0) * 1000), 1000);
});

test("sin naturalezas asignadas, todo el gasto aparece como sin clasificar", () => {
  const stats = buildCategoryStats({ categories: CATEGORIES, today: TODAY, spend: [spend(61, "2026-09-01", 3_000)] });
  assert.deepEqual(stats.natures.map((n) => [n.nature, n.windowCents]), [[null, 3_000]]);
});

test("cada categoría informa qué fracción de su gasto es discrecional (con sus subcategorías)", () => {
  const categories: StatCategory[] = [
    { id: 10, name: "Alimentación", parentId: null, nature: null },
    { id: 11, name: "Despensa", parentId: 10, nature: "essential" },
    { id: 12, name: "Restaurantes", parentId: 10, nature: "discretionary" },
    { id: 20, name: "Vivienda", parentId: null, nature: "essential" },
    { id: 30, name: "Ocio", parentId: null, nature: "discretionary" },
  ];
  const stats = buildCategoryStats({
    categories,
    today: TODAY,
    spend: [spend(11, "2026-09-01", 3_000), spend(12, "2026-09-01", 1_000), spend(20, "2026-09-01", 5_000), spend(30, "2026-09-01", 2_000)],
  });
  const share = (name: string) => stats.rows.find((r) => r.name === name)!.discretionaryShare;
  assert.equal(share("Alimentación"), 0.25);
  assert.equal(share("Despensa"), 0);
  assert.equal(share("Restaurantes"), 1);
  assert.equal(share("Vivienda"), 0);
  assert.equal(share("Ocio"), 1);
});
