import assert from "node:assert/strict";
import { test } from "node:test";
import { assertValidGoalInput, InvalidGoalError } from "./rules";

test("assertValidGoalInput: rechaza nombre vacío", () => {
  assert.throws(() => assertValidGoalInput("", 100_000), InvalidGoalError);
  assert.throws(() => assertValidGoalInput("   ", 100_000), InvalidGoalError);
});

test("assertValidGoalInput: rechaza monto objetivo 0 o negativo", () => {
  assert.throws(() => assertValidGoalInput("Vacaciones", 0), InvalidGoalError);
  assert.throws(() => assertValidGoalInput("Vacaciones", -500), InvalidGoalError);
});

test("assertValidGoalInput: acepta nombre y monto válidos", () => {
  assert.doesNotThrow(() => assertValidGoalInput("Vacaciones", 100_000));
});
