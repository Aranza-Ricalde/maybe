import assert from "node:assert/strict";
import { test } from "node:test";
import { clampIndex, stepIndex } from "./reviewQueue";

test("el índice se mantiene dentro de la cola aunque ésta se acorte", () => {
  assert.equal(clampIndex(5, 3), 2);
  assert.equal(clampIndex(-1, 3), 0);
  assert.equal(clampIndex(1, 0), 0);
});

test("avanzar y retroceder da la vuelta en ambos extremos", () => {
  assert.equal(stepIndex(2, 1, 3), 0);
  assert.equal(stepIndex(0, -1, 3), 2);
  assert.equal(stepIndex(0, -4, 3), 2);
  assert.equal(stepIndex(0, 1, 0), 0);
});
