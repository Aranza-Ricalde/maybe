import assert from "node:assert/strict";
import { test } from "node:test";
import { MENU_PAGE_SIZE, ROOT_PARENT, buildCategoryMenu, type MenuCategory } from "./categoryMenu";

const cat = (id: number, name: string, parentId: number | null = null, classification: "expense" | "income" = "expense"): MenuCategory => ({ id, name, parentId, classification });

test("la raíz lista las categorías padre en orden alfabético y marca las que tienen subcategorías", () => {
  const menu = buildCategoryMenu([cat(1, "Vivienda"), cat(2, "Renta", 1), cat(3, "Comida"), cat(4, "Nómina", null, "income")], "expense", ROOT_PARENT, 0);
  assert.deepEqual(menu.items.map((i) => [i.label, i.opensChildren]), [["Comida", false], ["Vivienda", true]]);
  assert.equal(menu.parent, null);
});

test("dentro de un padre solo salen sus hijas, sin descender más", () => {
  const menu = buildCategoryMenu([cat(1, "Vivienda"), cat(2, "Renta", 1), cat(3, "Agua", 1)], "expense", 1, 0);
  assert.equal(menu.parent?.name, "Vivienda");
  assert.deepEqual(menu.items.map((i) => [i.label, i.opensChildren]), [["Agua", false], ["Renta", false]]);
});

test("pagina sin cortar la lista: ninguna categoría queda fuera", () => {
  const all = Array.from({ length: 19 }, (_, i) => cat(i + 1, `Cat ${String(i).padStart(2, "0")}`));
  const pages = Math.ceil(19 / MENU_PAGE_SIZE);
  const seen = Array.from({ length: pages }, (_, page) => buildCategoryMenu(all, "expense", ROOT_PARENT, page)).flatMap((menu) => menu.items.map((i) => i.categoryId));
  assert.equal(new Set(seen).size, 19);
  assert.equal(buildCategoryMenu(all, "expense", ROOT_PARENT, 0).pages, pages);
});

test("una página fuera de rango se ajusta; un padre inexistente o de otro tipo muestra la raíz vacía de ese padre", () => {
  const all = [cat(1, "A"), cat(2, "B")];
  assert.equal(buildCategoryMenu(all, "expense", ROOT_PARENT, 99).page, 0);
  assert.equal(buildCategoryMenu(all, "expense", ROOT_PARENT, -3).page, 0);
  assert.equal(buildCategoryMenu(all, "income", ROOT_PARENT, 0).items.length, 0);
});

test("una categoría con padre de otro tipo o ausente se trata como raíz y no se pierde", () => {
  const menu = buildCategoryMenu([cat(1, "Huérfana", 99), cat(2, "Padre de ingreso", null, "income"), cat(3, "Hija", 2)], "expense", ROOT_PARENT, 0);
  assert.deepEqual(menu.items.map((i) => i.label).sort(), ["Hija", "Huérfana"].sort());
});
