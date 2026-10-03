import assert from "node:assert/strict";
import { test } from "node:test";
import { assertValidConceptName, InvalidConceptError } from "./rules";

test("assertValidConceptName: rechaza nombre vacío o solo espacios", () => {
  assert.throws(() => assertValidConceptName(""), InvalidConceptError);
  assert.throws(() => assertValidConceptName("   "), InvalidConceptError);
});

test("assertValidConceptName: acepta un nombre válido", () => {
  assert.doesNotThrow(() => assertValidConceptName("Internet Casa"));
});
