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
