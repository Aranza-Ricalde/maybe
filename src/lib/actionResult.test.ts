import assert from "node:assert/strict";
import { test } from "node:test";
import { GENERIC_FAILURE_MESSAGE, actionFailed, actionOk, isFailed, sentenceCase } from "./actionResult";

test("los resultados indican si la acción salió bien", () => {
  assert.deepEqual(actionOk("Listo"), { ok: true, message: "Listo" });
  assert.equal(isFailed(actionFailed("mal")), true);
  assert.equal(isFailed(actionOk("bien")), false);
  assert.equal(isFailed(undefined), false);
});

test("los mensajes de error se presentan como oración completa", () => {
  assert.equal(sentenceCase("el periodo se traslapa con otro"), "El periodo se traslapa con otro.");
  assert.equal(sentenceCase("Ya existe."), "Ya existe.");
  assert.equal(sentenceCase("   "), GENERIC_FAILURE_MESSAGE);
});
