import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeCallback, encodeCallback } from "./callbacks";

test("cada acción de botón se codifica y decodifica sin perder datos", () => {
  const cases = [
    { action: "ok", id: 5 },
    { action: "undo", id: 5 },
    { action: "change", id: 5 },
    { action: "cancel", id: 7 },
    { action: "cat", id: 5, arg: 12 },
    { action: "acct", id: 7, arg: 3 },
    { action: "nav", id: 5, arg: 0, page: 0 },
    { action: "nav", id: 5, arg: 40, page: 2 },
  ] as const;
  for (const callback of cases) assert.deepEqual(decodeCallback(encodeCallback(callback)), callback);
});

test("los datos de botón caben en los 64 bytes que permite Telegram incluso con ids enormes", () => {
  assert.ok(encodeCallback({ action: "nav", id: 9_007_199_254_740_991, arg: 9_007_199_254_740_991, page: 99 }).length <= 64);
});

test("datos malformados, con extras o con ids inválidos se rechazan", () => {
  for (const data of ["", "ok", "ok:abc", "ok:0", "ok:-1", "ok:1:2", "cat:1", "cat:1:0", "cat:1:x", "acct:1", "nav:1:x:0", "nav:1:2:-1", "boom:1", "undo:1:2:3:4", "cat:1:2:3"]) {
    assert.equal(decodeCallback(data), null, data);
  }
});
