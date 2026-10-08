import assert from "node:assert/strict";
import { test } from "node:test";
import { sparklinePath } from "./sparkline";

test("una serie de menos de dos puntos no se dibuja", () => {
  assert.equal(sparklinePath([], 100, 20), null);
  assert.equal(sparklinePath([5], 100, 20), null);
});

test("el mínimo queda abajo y el máximo arriba, con margen", () => {
  assert.equal(sparklinePath([0, 10], 100, 20), "M2.0 18.0 L98.0 2.0");
});

test("una serie plana se dibuja a media altura", () => {
  assert.equal(sparklinePath([3, 3, 3], 100, 20), "M2.0 10.0 L50.0 10.0 L98.0 10.0");
});
