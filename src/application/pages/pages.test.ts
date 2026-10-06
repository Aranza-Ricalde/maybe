import assert from "node:assert/strict";
import { test } from "node:test";
import type { AccountsReader, PlanningReader } from "@/domain/readModels/ports";
import type { GetAccountBalanceHistoryUseCase } from "../getAccountBalanceHistory";
import type { GetGoalProjectionsUseCase } from "../getGoalProjections";
import { GetAccountsPageUseCase } from "./getAccountsPage";
import { GetGoalsPageUseCase } from "./getGoalsPage";

const TODAY = "2026-10-06";
const ACCOUNTS = [
  { id: 1, name: "Cuenta Nómina", type: "checking" as const, details: null },
  { id: 2, name: "Nu TDC", type: "credit_card" as const, details: { creditLimitCents: 500_000 } },
];

const accountsReader: AccountsReader = {
  listActive: async () => ACCOUNTS,
  listArchived: async () => [{ id: 9, name: "Efectivo", type: "cash", details: null }],
  balancesAsOf: async () => new Map([[1, 10_000], [2, -5_000]]),
  movementsPage: async () => ({ rows: [], total: 0 }),
};

test("página de cuentas: filas con saldo, archivadas sin detalles y serie inicial de la cuenta por defecto", async () => {
  const history = { execute: async (accountId: number, range: string) => [{ date: TODAY, value: accountId * 100, range }] } as unknown as GetAccountBalanceHistoryUseCase;
  const page = await new GetAccountsPageUseCase(accountsReader, history).execute(1, TODAY);

  assert.deepEqual(page.accounts.map((a) => [a.id, a.balanceCents, a.creditLimitCents]), [[1, 10_000, null], [2, -5_000, 500_000]]);
  assert.deepEqual(page.archivedAccounts, [{ id: 9, name: "Efectivo", type: "cash" }]);
  assert.equal(page.initialBalanceSeries.length, 1);
});

test("página de metas: liga cuentas por meta y reutiliza las proyecciones", async () => {
  const planning = {
    goals: async () => [{ id: 1, name: "Viaje", targetAmountCents: 100_000, targetDate: null }],
    goalAccountLinks: async () => [{ goalId: 1, accountId: 1 }],
  } as unknown as PlanningReader;
  const projections = { execute: async () => [{ goalId: 1, currentCents: 40_000, projection: null, message: "ritmo" }] } as unknown as GetGoalProjectionsUseCase;

  const page = await new GetGoalsPageUseCase(planning, accountsReader, projections).execute(1, TODAY);

  assert.equal(page.rows[0].currentCents, 40_000);
  assert.deepEqual(page.rows[0].linkedAccountNames, ["Cuenta Nómina"]);
  assert.equal(page.rows[0].projection, "ritmo");
});
