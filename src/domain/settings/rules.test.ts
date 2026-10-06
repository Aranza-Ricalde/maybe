import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_MINIMUM_BALANCE_CENTS, InvalidSettingError, assertValidMinimumBalance, effectiveMinimumBalance } from "./rules";

test("sin saldo mínimo definido se usa el valor por defecto; con uno, el del usuario (incluso cero)", () => {
  assert.equal(effectiveMinimumBalance(null), DEFAULT_MINIMUM_BALANCE_CENTS);
  assert.equal(effectiveMinimumBalance(500_000), 500_000);
  assert.equal(effectiveMinimumBalance(0), 0);
});

test("acepta cero, montos positivos enteros y null (borrar la preferencia)", () => {
  for (const ok of [0, 1, 500_000, null]) assert.doesNotThrow(() => assertValidMinimumBalance(ok));
});

test("rechaza negativos, decimales, números imposibles y montos absurdos", () => {
  for (const bad of [-1, 10.5, Number.NaN, Number.POSITIVE_INFINITY, 1_000_000_000_01]) assert.throws(() => assertValidMinimumBalance(bad), InvalidSettingError);
});
