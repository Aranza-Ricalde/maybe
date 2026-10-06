import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeProviderName } from "./rules";

test("normalizeProviderName: recorta y colapsa espacios", () => {
  assert.equal(normalizeProviderName("  Telmex   Internet  "), "Telmex Internet");
});
