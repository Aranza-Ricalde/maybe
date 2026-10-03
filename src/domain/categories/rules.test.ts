import assert from "node:assert/strict";
import { test } from "node:test";
import { assertValidCategoryClassification, assertValidCategoryName, InvalidCategoryError } from "./rules";

test("assertValidCategoryName: rechaza nombre vacío o solo espacios", () => {
  assert.throws(() => assertValidCategoryName(""), InvalidCategoryError);
  assert.throws(() => assertValidCategoryName("  "), InvalidCategoryError);
});

test("assertValidCategoryName: acepta nombre no vacío", () => {
  assert.doesNotThrow(() => assertValidCategoryName("Comida"));
});

test("assertValidCategoryClassification: rechaza clasificación inválida", () => {
  assert.throws(() => assertValidCategoryClassification("ahorro"), InvalidCategoryError);
});

test("assertValidCategoryClassification: acepta income y expense", () => {
  assert.doesNotThrow(() => assertValidCategoryClassification("income"));
  assert.doesNotThrow(() => assertValidCategoryClassification("expense"));
});
