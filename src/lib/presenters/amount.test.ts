import assert from "node:assert/strict";
import { test } from "node:test";
import { joinSignedAmount, splitSignedAmount } from "./amount";

test("un monto negativo es un gasto y uno positivo un ingreso", () => {
  assert.deepEqual(splitSignedAmount("-123.45"), { kind: "expense", magnitude: "123.45" });
  assert.deepEqual(splitSignedAmount("777.77"), { kind: "income", magnitude: "777.77" });
});

test("sin valor usa el tipo por defecto", () => {
  assert.deepEqual(splitSignedAmount(undefined), { kind: "expense", magnitude: "" });
  assert.deepEqual(splitSignedAmount("", "income"), { kind: "income", magnitude: "" });
});

test("al unir, el gasto lleva signo menos y el ingreso no, sin duplicar signos", () => {
  assert.equal(joinSignedAmount("expense", "123.45"), "-123.45");
  assert.equal(joinSignedAmount("expense", "-123.45"), "-123.45");
  assert.equal(joinSignedAmount("income", "+50"), "50");
  assert.equal(joinSignedAmount("income", ""), "");
});
