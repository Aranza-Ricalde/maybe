import assert from "node:assert/strict";
import { test } from "node:test";
import { explainChange, MAX_CHILD_NODES, MAX_ROOT_NODES } from "./explain";
import { UNCATEGORIZED_ID, buildCategoryStats, type MonthlyCategorySpend, type StatCategory } from "./rules";

const TODAY = "2026-10-12";
const CATEGORIES: StatCategory[] = [
  { id: 10, name: "Ocio", parentId: null },
  { id: 11, name: "Restaurantes", parentId: 10 },
  { id: 12, name: "Videojuegos", parentId: 10 },
  { id: 13, name: "Cine", parentId: 10 },
  { id: 20, name: "Comida", parentId: null },
  { id: 30, name: "Transporte", parentId: null },
];
const spend = (categoryId: number | null, month: string, spentCents: number): MonthlyCategorySpend => ({ categoryId, month, spentCents, count: 1 });
const explain = (rows: MonthlyCategorySpend[], cats = CATEGORIES) => explainChange(buildCategoryStats({ categories: cats, today: TODAY, spend: rows }));

test("el ejemplo de principios.md: gastos suben y se desglosan en categorías y subcategorías", () => {
  const result = explain([
    spend(11, "2026-08-01", 100_000), spend(11, "2026-09-01", 150_000),
    spend(12, "2026-08-01", 50_000), spend(12, "2026-09-01", 75_000),
    spend(13, "2026-08-01", 20_000), spend(13, "2026-09-01", 35_000),
    spend(20, "2026-08-01", 200_000), spend(20, "2026-09-01", 260_000),
    spend(30, "2026-08-01", 100_000), spend(30, "2026-09-01", 130_000),
  ])!;
  assert.equal(result.month, "2026-09-01");
  assert.equal(result.totalDeltaCents, 180_000);
  assert.deepEqual(result.nodes.map((n) => [n.name, n.deltaCents]), [["Ocio", 90_000], ["Comida", 60_000], ["Transporte", 30_000]]);
  const ocio = result.nodes[0];
  assert.deepEqual(ocio.children.map((c) => [c.name, c.deltaCents]), [["Restaurantes", 50_000], ["Videojuegos", 25_000], ["Cine", 15_000]]);
  assert.equal(ocio.href, "/transactions?categoryId=10&from=2026-09-01&to=2026-09-30");
  assert.equal(ocio.children[0].href, "/transactions?categoryId=11&from=2026-09-01&to=2026-09-30");
});

test("lo que se muestra reconcilia con el total: nada se pierde", () => {
  const result = explain([
    spend(11, "2026-08-01", 100_000), spend(11, "2026-09-01", 150_000),
    spend(10, "2026-08-01", 10_000), spend(10, "2026-09-01", 40_000), // gasto propio de la madre
    spend(20, "2026-08-01", 200_000), spend(20, "2026-09-01", 180_000),
  ])!;
  assert.equal(result.nodes.reduce((s, n) => s + n.deltaCents, 0), result.totalDeltaCents);
  const ocio = result.nodes.find((n) => n.name === "Ocio")!;
  assert.equal(ocio.children.reduce((s, c) => s + c.deltaCents, 0), ocio.deltaCents);
  assert.equal(ocio.children.at(-1)?.name, "Otros");
  assert.equal(ocio.children.at(-1)?.deltaCents, 30_000);
});

test("las bajadas también se explican, y el gasto sin categoría aparece sin enlace", () => {
  const result = explain([spend(30, "2026-08-01", 300_000), spend(30, "2026-09-01", 100_000), spend(null, "2026-08-01", 10_000), spend(null, "2026-09-01", 50_000)])!;
  assert.equal(result.nodes[0].name, "Transporte");
  assert.equal(result.nodes[0].deltaCents, -200_000);
  const uncategorized = result.nodes.find((n) => n.categoryId === UNCATEGORIZED_ID)!;
  assert.equal(uncategorized.deltaCents, 40_000);
  assert.equal(uncategorized.href, undefined);
});

test("con demasiadas categorías, las menores se agrupan en 'Otras categorías' y la suma sigue cuadrando", () => {
  const cats: StatCategory[] = Array.from({ length: MAX_ROOT_NODES + 3 }, (_, i) => ({ id: 100 + i, name: `Cat ${i}`, parentId: null }));
  const rows = cats.flatMap((c, i) => [spend(c.id, "2026-08-01", 10_000), spend(c.id, "2026-09-01", 10_000 + (i + 1) * 1_000)]);
  const result = explain(rows, cats)!;
  assert.equal(result.nodes.length, MAX_ROOT_NODES + 1);
  assert.equal(result.nodes.at(-1)?.name, "Otras categorías");
  assert.equal(result.nodes.reduce((s, n) => s + n.deltaCents, 0), result.totalDeltaCents);
});

test("con muchas subcategorías, solo se muestran las que más movieron y el resto va en 'Otros'", () => {
  const cats: StatCategory[] = [{ id: 1, name: "Casa", parentId: null }, ...Array.from({ length: MAX_CHILD_NODES + 2 }, (_, i) => ({ id: 2 + i, name: `Sub ${i}`, parentId: 1 }))];
  const rows = cats.slice(1).flatMap((c, i) => [spend(c.id, "2026-08-01", 5_000), spend(c.id, "2026-09-01", 5_000 + (i + 1) * 1_000)]);
  const casa = explain(rows, cats)!.nodes[0];
  assert.equal(casa.children.length, MAX_CHILD_NODES + 1);
  assert.equal(casa.children.reduce((s, c) => s + c.deltaCents, 0), casa.deltaCents);
});

test("categorías sin cambio no estorban, y con menos de dos meses completos no hay comparación", () => {
  const same = explain([spend(30, "2026-08-01", 100_000), spend(30, "2026-09-01", 100_000), spend(20, "2026-08-01", 10_000), spend(20, "2026-09-01", 25_000)])!;
  assert.deepEqual(same.nodes.map((n) => n.name), ["Comida"]);
  assert.equal(explain([spend(30, "2026-09-01", 100_000)]), null);
  assert.equal(explain([]), null);
});
