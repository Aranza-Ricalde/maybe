import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_STATS_PARAMS } from "@/domain/stats/params";
import { availableGroups, canCompare, canProject } from "./statsControls";

test("cada métrica ofrece solo las agrupaciones que el modelo soporta", () => {
  assert.deepEqual(availableGroups("expense"), ["time", "category", "merchant"]);
  assert.deepEqual(availableGroups("income"), ["time"]);
  assert.deepEqual(availableGroups("balance"), ["time", "account"]);
});

test("proyectar solo con saldo en el tiempo y sin filtro de cuenta; comparar solo en el tiempo y sin saldo", () => {
  const balance = { ...DEFAULT_STATS_PARAMS, metric: "balance" as const, group: "time" as const };
  assert.equal(canProject(balance), true);
  assert.equal(canProject({ ...balance, accountId: 2 }), false);
  assert.equal(canCompare(balance), false);
  assert.equal(canCompare({ ...DEFAULT_STATS_PARAMS, group: "time" }), true);
  assert.equal(canCompare(DEFAULT_STATS_PARAMS), false);
});
