import assert from "node:assert/strict";
import { test } from "node:test";
import type { GetAccountBalanceHistoryUseCase } from "./getAccountBalanceHistory";
import { GetAccountsBalanceHistoryUseCase } from "./getAccountsBalanceHistory";

const history = {
  execute: async (accountId: number) => [
    { date: "2026-10-01", value: accountId * 100 },
    { date: "2026-10-02", value: accountId * 100 + 1 },
  ],
} as unknown as GetAccountBalanceHistoryUseCase;

test("une las series de las cuentas por fecha y conserva solo las 5 de mayor saldo", async () => {
  const accounts = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, name: `Cuenta ${i + 1}` }));
  const result = await new GetAccountsBalanceHistoryUseCase(history).execute(accounts, "30d", "2026-10-07");
  assert.equal(result.accounts.length, 5);
  assert.deepEqual(result.accounts.map((a) => a.label), ["Cuenta 7", "Cuenta 6", "Cuenta 5", "Cuenta 4", "Cuenta 3"]);
  assert.equal(result.points.length, 2);
  assert.equal(result.points[0].a7, 700);
});

test("sin cuentas no hay series ni puntos", async () => {
  const result = await new GetAccountsBalanceHistoryUseCase(history).execute([], "30d", "2026-10-07");
  assert.deepEqual(result, { accounts: [], points: [] });
});
