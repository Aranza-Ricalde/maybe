import assert from "node:assert/strict";
import { test } from "node:test";
import { areAllExpanded, countOverChildren, toggleExpanded, visibleBudgetRows, type BudgetTreeRow } from "./budgetTree";

const row = (categoryId: number, parentId: number | null, over = false, hasChildren = false): BudgetTreeRow => ({
  categoryId,
  parentId,
  hasChildren,
  effectiveBudgetedCents: 1000,
  actualCents: over ? -2000 : -500,
});

const rows = [row(1, null, false, true), row(2, 1, true), row(3, 1, false), row(4, null)];

test("cuenta las subcategorías que se pasaron por padre", () => {
  assert.deepEqual([...countOverChildren(rows)], [[1, 1]]);
});

test("las subcategorías solo se ven cuando su padre está expandido", () => {
  assert.deepEqual(visibleBudgetRows(rows, new Set()).map((r) => r.categoryId), [1, 4]);
  const expanded = visibleBudgetRows(rows, new Set([1]));
  assert.deepEqual(expanded.map((r) => r.categoryId), [1, 2, 3, 4]);
  assert.equal(expanded[0].childrenOverCount, 1);
  assert.equal(expanded[0].isExpanded, true);
});

test("alternar agrega y quita, sin mutar el conjunto original", () => {
  const original = new Set<number>();
  const next = toggleExpanded(original, 1);
  assert.equal(original.size, 0);
  assert.deepEqual([...next], [1]);
  assert.equal(toggleExpanded(next, 1).size, 0);
});

test("todo expandido solo si hay padres y todos están abiertos", () => {
  assert.equal(areAllExpanded(rows, new Set([1])), true);
  assert.equal(areAllExpanded(rows, new Set()), false);
  assert.equal(areAllExpanded([row(4, null)], new Set()), false);
});
