import assert from "node:assert/strict";
import { test } from "node:test";
import { assertValidCategoryClassification, assertValidCategoryName, InvalidCategoryError } from "./rules";

test("assertValidCategoryName: rechaza nombre vacío o solo espacios", () => {
  assert.throws(() => assertValidCategoryName(""), InvalidCategoryError);
  assert.throws(() => assertValidCategoryName("  "), InvalidCategoryError);
});

test("assertValidCategoryName: acepta nombre no vacío", () => {
  assert.doesNotThrow(() => assertValidCategoryName("Comida"));
});

test("assertValidCategoryClassification: rechaza clasificación inválida", () => {
  assert.throws(() => assertValidCategoryClassification("ahorro"), InvalidCategoryError);
});

test("assertValidCategoryClassification: acepta income y expense", () => {
  assert.doesNotThrow(() => assertValidCategoryClassification("income"));
  assert.doesNotThrow(() => assertValidCategoryClassification("expense"));
});

import {
  assertValidCategoryParent,
  orderCategoriesAsTree,
  type CategoryParentValidationInput,
} from "./rules";

function parentInput(overrides: Partial<CategoryParentValidationInput> = {}): CategoryParentValidationInput {
  return {
    familyId: 1,
    classification: "expense",
    parentId: 10,
    parent: { id: 10, familyId: 1, parentId: null, classification: "expense" },
    childClassifications: [],
    ...overrides,
  };
}

test("assertValidCategoryParent: sin madre es válido", () => {
  assert.doesNotThrow(() => assertValidCategoryParent(parentInput({ parentId: null, parent: null })));
});

test("assertValidCategoryParent: una subcategoría válida bajo una madre de primer nivel y mismo tipo", () => {
  assert.doesNotThrow(() => assertValidCategoryParent(parentInput()));
});

test("assertValidCategoryParent: rechaza ser su propia madre", () => {
  assert.throws(() => assertValidCategoryParent(parentInput({ categoryId: 10 })), InvalidCategoryError);
});

test("assertValidCategoryParent: rechaza una madre inexistente o de otra family", () => {
  assert.throws(() => assertValidCategoryParent(parentInput({ parent: null })), InvalidCategoryError);
  assert.throws(
    () => assertValidCategoryParent(parentInput({ parent: { id: 10, familyId: 2, parentId: null, classification: "expense" } })),
    InvalidCategoryError,
  );
});

test("assertValidCategoryParent: no permite un tercer nivel (la madre ya es subcategoría)", () => {
  assert.throws(
    () => assertValidCategoryParent(parentInput({ parent: { id: 10, familyId: 1, parentId: 5, classification: "expense" } })),
    InvalidCategoryError,
  );
});

test("assertValidCategoryParent: una categoría con subcategorías no puede volverse subcategoría", () => {
  assert.throws(() => assertValidCategoryParent(parentInput({ categoryId: 3, childClassifications: ["expense"] })), InvalidCategoryError);
});

test("assertValidCategoryParent: la subcategoría debe ser del mismo tipo que su madre", () => {
  assert.throws(() => assertValidCategoryParent(parentInput({ classification: "income" })), InvalidCategoryError);
});

test("assertValidCategoryParent: no se puede cambiar el tipo de una madre cuyas hijas son de otro tipo", () => {
  assert.throws(
    () => assertValidCategoryParent(parentInput({ categoryId: 3, parentId: null, parent: null, classification: "income", childClassifications: ["expense"] })),
    InvalidCategoryError,
  );
});

test("orderCategoriesAsTree: cada madre seguida de sus hijas, ordenadas por nombre", () => {
  const rows = [
    { id: 1, name: "Servicios", parentId: 3 },
    { id: 2, name: "Transporte", parentId: null },
    { id: 3, name: "Vivienda", parentId: null },
    { id: 4, name: "Renta", parentId: 3 },
  ];
  const tree = orderCategoriesAsTree(rows);
  assert.deepEqual(tree.map((r) => `${r.depth}:${r.name}`), ["0:Transporte", "0:Vivienda", "1:Renta", "1:Servicios"]);
  assert.equal(tree.find((r) => r.name === "Vivienda")?.hasChildren, true);
  assert.equal(tree.find((r) => r.name === "Transporte")?.hasChildren, false);
});

test("orderCategoriesAsTree: una subcategoría huérfana (madre ausente) se muestra como de primer nivel y no se pierde", () => {
  const tree = orderCategoriesAsTree([{ id: 1, name: "Huérfana", parentId: 99 }]);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].depth, 0);
});

import { categoryBreakdown, categoryOptionsWithHierarchy } from "./rules";

test("categoryOptionsWithHierarchy: las subcategorías llevan la ruta completa y salen después de su madre", () => {
  const options = categoryOptionsWithHierarchy([
    { id: 54, name: "Servicios", parentId: 43 },
    { id: 42, name: "Transporte", parentId: null },
    { id: 43, name: "Vivienda", parentId: null },
    { id: 51, name: "Renta", parentId: 43 },
  ]);
  assert.deepEqual(options.map((o) => o.label), ["Transporte", "Vivienda", "Vivienda › Renta", "Vivienda › Servicios"]);
  assert.deepEqual(options.map((o) => o.id), [42, 43, 51, 54]);
});

test("categoryOptionsWithHierarchy: una subcategoría huérfana conserva su nombre simple (no se pierde ni se rompe)", () => {
  const [o] = categoryOptionsWithHierarchy([{ id: 1, name: "Huérfana", parentId: 99 }]);
  assert.equal(o.label, "Huérfana");
});

const TREE = [
  { id: 43, name: "Vivienda", parentId: null },
  { id: 51, name: "Renta", parentId: 43 },
  { id: 54, name: "Servicios", parentId: 43 },
  { id: 42, name: "Transporte", parentId: null },
];

test("categoryBreakdown: la madre suma lo suyo y lo de sus hijas, y las hijas se listan debajo", () => {
  const rows = categoryBreakdown(
    [{ categoryId: 43, totalCents: -10_000 }, { categoryId: 51, totalCents: -300_000 }, { categoryId: 54, totalCents: -50_000 }, { categoryId: 42, totalCents: -100_000 }],
    TREE,
  );
  assert.deepEqual(rows.map((r) => `${r.depth}:${r.name}:${r.totalCents}`), ["0:Vivienda:-360000", "1:Renta:-300000", "1:Servicios:-50000", "0:Transporte:-100000"]);
});

test("categoryBreakdown: las filas principales suman exactamente el gasto total (las hijas no se cuentan dos veces)", () => {
  const totals = [{ categoryId: 43, totalCents: -10_000 }, { categoryId: 51, totalCents: -300_000 }, { categoryId: 54, totalCents: -50_000 }, { categoryId: 42, totalCents: -100_000 }];
  const rows = categoryBreakdown(totals, TREE);
  const sumOfRoots = rows.filter((r) => r.depth === 0).reduce((s, r) => s + r.totalCents, 0);
  assert.equal(sumOfRoots, totals.reduce((s, t) => s + t.totalCents, 0));
});

test("categoryBreakdown: una madre sin gasto propio aparece si sus hijas gastaron; sin gasto en toda la rama no aparece", () => {
  const rows = categoryBreakdown([{ categoryId: 54, totalCents: -50_000 }], TREE);
  assert.deepEqual(rows.map((r) => r.name), ["Vivienda", "Servicios"]);
});

test("categoryBreakdown: el gasto de una categoría desconocida no se pierde y se muestra como 'Otro'", () => {
  const rows = categoryBreakdown([{ categoryId: 999, totalCents: -7_000 }], TREE);
  assert.deepEqual(rows.map((r) => `${r.name}:${r.totalCents}`), ["Otro:-7000"]);
});
