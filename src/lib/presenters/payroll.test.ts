import assert from "node:assert/strict";
import { test } from "node:test";
import { describePaydays, parseDayInput } from "./payroll";

test("describe uno o varios días de cobro en español", () => {
  assert.equal(describePaydays([]), "");
  assert.equal(describePaydays([5]), "el día 5");
  assert.equal(describePaydays([29, 14]), "los días 14 y 29");
});

test("un día válido es un entero entre 1 y 31", () => {
  assert.equal(parseDayInput("15"), 15);
  assert.equal(parseDayInput(""), null);
  assert.equal(parseDayInput("0"), null);
  assert.equal(parseDayInput("32"), null);
  assert.equal(parseDayInput("1.5"), null);
});
