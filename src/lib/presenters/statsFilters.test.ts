import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_STATS_PARAMS } from "@/domain/stats/params";
import { statsFilterPatch, statsFilterValues } from "./statsFilters";

test("los filtros vacíos se expresan como cadena vacía para los selectores", () => {
  assert.deepEqual(statsFilterValues(DEFAULT_STATS_PARAMS), { accountId: "", categoryId: "", merchant: "", nature: "" });
  assert.equal(statsFilterValues({ ...DEFAULT_STATS_PARAMS, accountId: 4 }).accountId, "4");
});

test("elegir o quitar un filtro produce el cambio de parámetros correspondiente", () => {
  assert.deepEqual(statsFilterPatch("accountId", "7"), { accountId: 7 });
  assert.deepEqual(statsFilterPatch("categoryId", ""), { categoryId: null });
  assert.deepEqual(statsFilterPatch("merchant", "Uber"), { merchant: "Uber" });
  assert.deepEqual(statsFilterPatch("nature", "essential"), { nature: "essential" });
  assert.deepEqual(statsFilterPatch("nature", "otra"), { nature: null });
});
