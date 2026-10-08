import assert from "node:assert/strict";
import { test } from "node:test";
import { sortedIds, togglePeriod } from "./periodSelection";

test("marcar agrega el periodo y desmarcar lo quita", () => {
  assert.deepEqual(sortedIds(togglePeriod(new Set([2]), 1, true)), [1, 2]);
  assert.deepEqual(sortedIds(togglePeriod(new Set([1, 2]), 1, false)), [2]);
});

test("nunca se puede quedar sin ningún periodo elegido", () => {
  assert.deepEqual(sortedIds(togglePeriod(new Set([3]), 3, false)), [3]);
});
