import assert from "node:assert/strict";
import { test } from "node:test";
import { fromSelectValue, toSelectValue } from "./selectValue";

test("el valor vacío viaja como marcador y vuelve a vacío", () => {
  assert.notEqual(toSelectValue(""), "");
  assert.equal(fromSelectValue(toSelectValue("")), "");
});

test("los demás valores no cambian", () => {
  assert.equal(toSelectValue("12"), "12");
  assert.equal(fromSelectValue("12"), "12");
});
