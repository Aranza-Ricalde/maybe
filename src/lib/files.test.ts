import assert from "node:assert/strict";
import { test } from "node:test";
import { filterByMime } from "./files";

test("solo deja pasar los archivos del tipo pedido", () => {
  const pdf = { type: "application/pdf" } as File;
  const png = { type: "image/png" } as File;
  assert.deepEqual(filterByMime([pdf, png], "application/pdf"), [pdf]);
  assert.deepEqual(filterByMime([], "application/pdf"), []);
});
