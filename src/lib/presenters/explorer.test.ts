import assert from "node:assert/strict";
import { test } from "node:test";
import { EXPLORER_ALL, EMPTY_EXPLORER_VALUES, buildExplorerOptions, describeDelta, toExplorerFilters } from "./explorer";

test("los filtros vacíos se vuelven nulos y los llenos se convierten", () => {
  const range = { from: "2026-10-01", to: "2026-10-31" };
  assert.deepEqual(toExplorerFilters(range, EMPTY_EXPLORER_VALUES), { ...range, accountId: null, categoryId: null, merchant: null, nature: null });
  assert.deepEqual(toExplorerFilters(range, { accountId: "3", categoryId: "7", merchant: "Oxxo", nature: "essential" }), { ...range, accountId: 3, categoryId: 7, merchant: "Oxxo", nature: "essential" });
});

test("el comercio elegido siempre es una opción aunque el resultado aún no lo traiga", () => {
  const options = buildExplorerOptions([], [], null, "Oxxo");
  assert.deepEqual(options.merchants.map((o) => o.id), [EXPLORER_ALL, "Oxxo"]);
});

test("la comparación distingue sube, baja e igual", () => {
  assert.equal(describeDelta({ deltaExpenseCents: 0, deltaExpensePct: null }).tone, "flat");
  assert.equal(describeDelta({ deltaExpenseCents: 500, deltaExpensePct: 0.1 }).tone, "up");
  assert.equal(describeDelta({ deltaExpenseCents: -500, deltaExpensePct: null }).tone, "down");
  assert.match(describeDelta({ deltaExpenseCents: 500, deltaExpensePct: 0.1 }).label, /\(\+10%\)/);
});
