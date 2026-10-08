import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSettingsSection, settingsSectionHref } from "./settings";

test("una sección desconocida o ausente cae en la primera", () => {
  assert.equal(parseSettingsSection(undefined), "cuenta");
  assert.equal(parseSettingsSection("otra"), "cuenta");
  assert.equal(parseSettingsSection(["periodos", "x"]), "periodos");
});

test("la dirección de la sección por defecto queda limpia", () => {
  assert.equal(settingsSectionHref("/settings", "cuenta"), "/settings");
  assert.equal(settingsSectionHref("/settings", "periodos"), "/settings?s=periodos");
});
