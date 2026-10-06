import assert from "node:assert/strict";
import { test } from "node:test";
import { groupBy, indexBy } from "./collections";

test("groupBy agrupa conservando el orden de cada grupo", () => {
  const groups = groupBy([{ k: "a", v: 1 }, { k: "b", v: 2 }, { k: "a", v: 3 }], (x) => x.k);
  assert.deepEqual(groups.get("a")?.map((x) => x.v), [1, 3]);
  assert.deepEqual(groups.get("b")?.map((x) => x.v), [2]);
});

test("indexBy indexa por clave", () => {
  assert.equal(indexBy([{ id: 1, n: "x" }, { id: 2, n: "y" }], (x) => x.id).get(2)?.n, "y");
});
