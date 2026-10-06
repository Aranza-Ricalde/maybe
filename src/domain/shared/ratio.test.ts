import assert from "node:assert/strict";
import { test } from "node:test";
import { ratioOrZero } from "./ratio";

test("ratioOrZero: divide y evita dividir entre cero", () => {
  assert.equal(ratioOrZero(25, 100), 0.25);
  assert.equal(ratioOrZero(5, 0), 0);
});
