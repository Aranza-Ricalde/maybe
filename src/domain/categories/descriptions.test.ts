import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_CATEGORY_DESCRIPTION_LENGTH, assertValidCategoryDescription, normalizeCategoryDescription, resolveCategoryDescription } from "./descriptions";
import { InvalidCategoryError } from "./rules";

test("la descripción propia manda sobre la sugerida", () => {
  assert.deepEqual(resolveCategoryDescription("Delivery", "Mis pedidos de fin de semana"), { text: "Mis pedidos de fin de semana", isSuggested: false });
});

test("sin descripción propia se sugiere una para categorías comunes, ignorando acentos y mayúsculas", () => {
  const delivery = resolveCategoryDescription("DELIVERY", null);
  assert.equal(delivery.isSuggested, true);
  assert.match(delivery.text ?? "", /Uber Eats/);
  assert.match(resolveCategoryDescription("Alimentación", "  ").text ?? "", /despensa/i);
  assert.match(resolveCategoryDescription("Mudanza y depósito", undefined).text ?? "", /flete/);
});

test("una categoría desconocida y sin descripción no inventa texto", () => {
  assert.deepEqual(resolveCategoryDescription("Mascotas", null), { text: null, isSuggested: false });
});

test("normalizar vacía los textos en blanco y valida el largo máximo", () => {
  assert.equal(normalizeCategoryDescription("   "), null);
  assert.equal(normalizeCategoryDescription("  Hola  "), "Hola");
  assert.doesNotThrow(() => assertValidCategoryDescription("x".repeat(MAX_CATEGORY_DESCRIPTION_LENGTH)));
  assert.throws(() => assertValidCategoryDescription("x".repeat(MAX_CATEGORY_DESCRIPTION_LENGTH + 1)), InvalidCategoryError);
  assert.doesNotThrow(() => assertValidCategoryDescription(null));
});
