import assert from "node:assert/strict";
import { test } from "node:test";
import { recurringDetailLabel } from "./recurring";

test("muestra solo lo que existe, sin guiones sobrantes", () => {
  assert.equal(recurringDetailLabel("Nu Débito", "Servicios"), "Nu Débito · Servicios");
  assert.equal(recurringDetailLabel(undefined, "Telefonía"), "Telefonía");
  assert.equal(recurringDetailLabel("Nu Débito", undefined), "Nu Débito");
  assert.equal(recurringDetailLabel(undefined, undefined), "Sin cuenta ni categoría");
});
