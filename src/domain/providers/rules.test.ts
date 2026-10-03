import assert from "node:assert/strict";
import { test } from "node:test";
import { assertValidProviderName, InvalidProviderError, normalizeProviderName } from "./rules";

test("normalizeProviderName: recorta y colapsa espacios", () => {
  assert.equal(normalizeProviderName("  Telmex   Internet  "), "Telmex Internet");
});

test("assertValidProviderName: rechaza nombre vacío o solo espacios", () => {
  assert.throws(() => assertValidProviderName(""), InvalidProviderError);
  assert.throws(() => assertValidProviderName("   "), InvalidProviderError);
});

test("assertValidProviderName: acepta un nombre válido", () => {
  assert.doesNotThrow(() => assertValidProviderName("Telmex"));
});
