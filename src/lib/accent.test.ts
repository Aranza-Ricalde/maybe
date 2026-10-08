import assert from "node:assert/strict";
import { test } from "node:test";
import { ACCENTS, ACCENT_LABELS, ACCENT_SWATCHES, DEFAULT_ACCENT, normalizeAccent } from "./accent";

test("un valor desconocido o ausente vuelve al acento por defecto", () => {
  assert.equal(normalizeAccent(undefined), DEFAULT_ACCENT);
  assert.equal(normalizeAccent(null), DEFAULT_ACCENT);
  assert.equal(normalizeAccent("fucsia"), DEFAULT_ACCENT);
  assert.equal(normalizeAccent("violet"), "violet");
});

test("cada acento tiene nombre y color de muestra", () => {
  for (const accent of ACCENTS) {
    assert.ok(ACCENT_LABELS[accent].length > 0);
    assert.match(ACCENT_SWATCHES[accent], /^#[0-9a-f]{6}$/);
  }
});
