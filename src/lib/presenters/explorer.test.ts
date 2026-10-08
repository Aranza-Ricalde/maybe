import assert from "node:assert/strict";
import { test } from "node:test";
import { EXPLORER_ALL, buildExplorerOptions } from "./explorer";

test("el comercio elegido siempre es una opción aunque el resultado aún no lo traiga", () => {
  const options = buildExplorerOptions([], [], null, "Oxxo");
  assert.deepEqual(options.merchants.map((o) => o.id), [EXPLORER_ALL, "Oxxo"]);
});
