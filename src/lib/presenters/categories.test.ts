import assert from "node:assert/strict";
import { test } from "node:test";
import { parentOptionsFor } from "./categories";

const rows = [
  { id: 1, name: "Casa", depth: 0 },
  { id: 2, name: "Renta", depth: 1 },
  { id: 3, name: "Ocio", depth: 0 },
];

test("solo las categorías principales, sin la propia, sirven de madre", () => {
  assert.deepEqual(parentOptionsFor(rows, 3, false), [{ value: "1", label: "Casa" }]);
});

test("una categoría con hijas no puede volverse subcategoría", () => {
  assert.deepEqual(parentOptionsFor(rows, 1, true), []);
});

import { expensesFirst, parentOptionsForNew } from "./categories";

test("las categorías padre para crear salen solo de las de primer nivel", () => {
  const rows = [{ id: 1, name: "Casa", depth: 0 }, { id: 2, name: "Renta", depth: 1 }];
  assert.deepEqual(parentOptionsForNew(rows), [{ value: "1", label: "Casa" }]);
});

test("los gastos van antes que los ingresos sin alterar el orden entre iguales", () => {
  const rows = [{ id: 1, classification: "expense" as const }, { id: 2, classification: "income" as const }, { id: 3, classification: "expense" as const }];
  assert.deepEqual(expensesFirst(rows).map((row) => row.id), [1, 3, 2]);
});
