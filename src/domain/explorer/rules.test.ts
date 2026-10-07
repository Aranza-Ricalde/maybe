import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidExplorerFiltersError, assertValidExplorerRange, bucketFor, bucketKeys, bucketStart, composeExplorer, filterRows, previousRange, sharesByCategory, sharesByMerchant, type ExplorerCategory, type ExplorerFilters, type ExplorerRow } from "./rules";

const CATEGORIES: ExplorerCategory[] = [
  { id: 1, parentId: null, name: "Vivienda", color: "#00f", spendingNature: "essential" },
  { id: 2, parentId: 1, name: "Renta", color: "#00f", spendingNature: "essential" },
  { id: 3, parentId: 1, name: "Agua", color: "#00f", spendingNature: "essential" },
  { id: 4, parentId: null, name: "Ocio", color: "#f0f", spendingNature: "discretionary" },
  { id: 5, parentId: null, name: "Salario", color: "#0f0", spendingNature: null },
];

const row = (bucket: string, categoryId: number | null, expenseCents: number, merchant: string | null = null, incomeCents = 0, count = 1): ExplorerRow => ({ bucket, categoryId, merchant, expenseCents, incomeCents, count });
const FILTERS: ExplorerFilters = { from: "2026-10-01", to: "2026-10-31", accountId: null, categoryId: null, merchant: null, nature: null };

test("el tamaño del cubo se adapta al rango: día, semana o mes", () => {
  assert.equal(bucketFor("2026-10-01", "2026-10-31"), "day");
  assert.equal(bucketFor("2026-08-01", "2026-10-31"), "week");
  assert.equal(bucketFor("2026-01-01", "2026-10-31"), "month");
});

test("la semana empieza en lunes y el mes en día 1", () => {
  assert.equal(bucketStart("2026-10-07", "week"), "2026-10-05");
  assert.equal(bucketStart("2026-10-05", "week"), "2026-10-05");
  assert.equal(bucketStart("2026-10-11", "week"), "2026-10-05");
  assert.equal(bucketStart("2026-10-17", "month"), "2026-10-01");
});

test("bucketKeys cubre todo el rango sin huecos ni repeticiones, también cruzando años", () => {
  assert.deepEqual(bucketKeys("2026-12-29", "2027-01-02", "day").length, 5);
  assert.deepEqual(bucketKeys("2026-11-15", "2027-02-10", "month"), ["2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01"]);
  const weeks = bucketKeys("2026-10-01", "2026-10-31", "week");
  assert.equal(weeks[0], "2026-09-28");
  assert.equal(new Set(weeks).size, weeks.length);
});

test("el periodo anterior tiene la misma duración y termina el día antes", () => {
  assert.deepEqual(previousRange("2026-10-01", "2026-10-31"), { from: "2026-08-31", to: "2026-09-30" });
  assert.deepEqual(previousRange("2026-10-15", "2026-10-15"), { from: "2026-10-14", to: "2026-10-14" });
});

test("un rango invertido o de más de 400 días se rechaza", () => {
  assert.throws(() => assertValidExplorerRange("2026-10-31", "2026-10-01"), InvalidExplorerFiltersError);
  assert.throws(() => assertValidExplorerRange("2025-01-01", "2026-10-31"), InvalidExplorerFiltersError);
  assert.doesNotThrow(() => assertValidExplorerRange("2026-10-01", "2026-10-01"));
});

test("filtrar por una categoría padre incluye sus subcategorías; por una hija, solo esa", () => {
  const rows = [row("2026-10-02", 2, 600_000), row("2026-10-03", 3, 20_000), row("2026-10-04", 4, 50_000)];
  assert.equal(filterRows(rows, { categoryId: 1, nature: null, merchant: null }, CATEGORIES).length, 2);
  assert.equal(filterRows(rows, { categoryId: 3, nature: null, merchant: null }, CATEGORIES).length, 1);
});

test("el tipo de gasto filtra por la naturaleza de la categoría y deja fuera ingresos y sin categoría", () => {
  const rows = [row("2026-10-02", 2, 600_000), row("2026-10-04", 4, 50_000), row("2026-10-05", null, 10_000), row("2026-10-06", 5, 0, null, 2_000_000)];
  const discretionary = filterRows(rows, { categoryId: null, nature: "discretionary", merchant: null }, CATEGORIES);
  assert.deepEqual(discretionary.map((r) => r.categoryId), [4]);
  assert.equal(filterRows(rows, { categoryId: null, nature: "essential", merchant: null }, CATEGORIES).every((r) => r.incomeCents === 0), true);
});

test("el filtro de comercio usa el nombre, y 'Sin comercio identificado' agrupa los que no tienen proveedor", () => {
  const rows = [row("2026-10-02", 4, 10_000, "Uber"), row("2026-10-03", 4, 20_000, null)];
  assert.equal(filterRows(rows, { categoryId: null, nature: null, merchant: "Uber" }, CATEGORIES).length, 1);
  assert.equal(filterRows(rows, { categoryId: null, nature: null, merchant: "Sin comercio identificado" }, CATEGORIES).length, 1);
});

test("el desglose por categoría suma subcategorías en su padre y ordena de mayor a menor", () => {
  const shares = sharesByCategory([row("2026-10-02", 2, 600_000), row("2026-10-03", 3, 20_000), row("2026-10-04", 4, 50_000), row("2026-10-05", null, 5_000)], CATEGORIES, null);
  assert.deepEqual(shares.map((s) => [s.name, s.totalCents]), [["Vivienda", 620_000], ["Ocio", 50_000], ["Sin categoría", 5_000]]);
  assert.equal(Math.round(shares.reduce((sum, s) => sum + s.share, 0) * 100), 100);
});

test("al entrar a un padre el desglose muestra sus subcategorías", () => {
  const shares = sharesByCategory([row("2026-10-02", 2, 600_000), row("2026-10-03", 3, 20_000)], CATEGORIES, 1);
  assert.deepEqual(shares.map((s) => s.name), ["Renta", "Agua"]);
});

test("más de 8 categorías se agrupan en 'Otras' sin perder dinero", () => {
  const many: ExplorerCategory[] = Array.from({ length: 12 }, (_, i) => ({ id: 100 + i, parentId: null, name: `C${i}`, color: "#000", spendingNature: null }));
  const shares = sharesByCategory(many.map((c, i) => row("2026-10-02", c.id, (i + 1) * 100)), many, null);
  assert.equal(shares.length, 9);
  assert.equal(shares.at(-1)?.name, "Otras");
  assert.equal(shares.reduce((sum, s) => sum + s.totalCents, 0), (12 * 13 / 2) * 100);
});

test("comercios: solo los identificados compiten; el resto se resume aparte y nada se pierde", () => {
  const { ranked, unidentified } = sharesByMerchant([row("2026-10-02", 4, 10_000, "Uber", 0, 3), row("2026-10-03", 4, 30_000, null, 0, 2), row("2026-10-04", 4, 5_000, "Oxxo")]);
  assert.deepEqual(ranked.map((m) => [m.name, m.totalCents, m.count]), [["Uber", 10_000, 3], ["Oxxo", 5_000, 1]]);
  assert.deepEqual(unidentified && [unidentified.totalCents, unidentified.count], [30_000, 2]);
});

test("composeExplorer: totales, serie sin huecos, comparación con el periodo anterior y qué categorías lo explican", () => {
  const result = composeExplorer({
    filters: FILTERS,
    bucket: "month",
    currentRows: [row("2026-10-01", 2, 600_000, "Renta", 0, 1), row("2026-10-01", 4, 200_000, "Cine", 0, 2), row("2026-10-01", 5, 0, null, 4_000_000, 2)],
    previousRows: [row("2026-09-01", 2, 600_000), row("2026-09-01", 4, 50_000)],
    categories: CATEGORIES,
    balance: [],
  });
  assert.equal(result.expenseCents, 800_000);
  assert.equal(result.incomeCents, 4_000_000);
  assert.equal(result.series.length, 1);
  assert.equal(result.comparison.expenseCents, 650_000);
  assert.equal(result.comparison.deltaExpenseCents, 150_000);
  assert.equal(Math.round((result.comparison.deltaExpensePct ?? 0) * 100), 23);
  assert.deepEqual(result.comparison.drivers.map((d) => [d.name, d.deltaCents]), [["Ocio", 150_000]]);
  assert.deepEqual(result.merchantOptions.sort(), ["Cine", "Renta"]);
});

test("composeExplorer con el filtro de comercio aplicado conserva todas las opciones de comercio disponibles", () => {
  const result = composeExplorer({
    filters: { ...FILTERS, merchant: "Uber" },
    bucket: "month",
    currentRows: [row("2026-10-01", 4, 10_000, "Uber"), row("2026-10-01", 4, 20_000, "Oxxo")],
    previousRows: [],
    categories: CATEGORIES,
    balance: [],
  });
  assert.equal(result.expenseCents, 10_000);
  assert.deepEqual(result.merchantOptions.sort(), ["Oxxo", "Uber"]);
});

test("al filtrar por un padre con subcategorías, drillParent lo indica; con una hija o sin hijas, no", () => {
  const base = { bucket: "month" as const, currentRows: [row("2026-10-01", 2, 1_000)], previousRows: [], categories: CATEGORIES, balance: [] };
  assert.deepEqual(composeExplorer({ ...base, filters: { ...FILTERS, categoryId: 1 } }).drillParent, { id: 1, name: "Vivienda" });
  assert.equal(composeExplorer({ ...base, filters: { ...FILTERS, categoryId: 2 } }).drillParent, null);
  assert.equal(composeExplorer({ ...base, filters: { ...FILTERS, categoryId: 4 } }).drillParent, null);
});
