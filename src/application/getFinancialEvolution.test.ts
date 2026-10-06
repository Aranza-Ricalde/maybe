import assert from "node:assert/strict";
import { test } from "node:test";
import type { DashboardRepository } from "@/domain/dashboard/ports";
import { GetFinancialEvolutionUseCase } from "./getFinancialEvolution";

const TODAY = "2026-10-06";
const account = (accountId: number) => ({ accountId, name: `c${accountId}`, type: "checking" as const, balanceCents: 0 });

function fakeRepo(calls: string[] = []): DashboardRepository {
  const unused = async () => {
    throw new Error("no se esperaba esta llamada");
  };
  return {
    getLiquidAccounts: unused,
    getSavingsAccounts: async () => [account(2)],
    getAssetAccounts: async () => [account(1), account(2)],
    getCreditCardAccounts: async () => [{ ...account(3), creditLimitCents: null }],
    getOtherLiabilityAccounts: async () => [account(4)],
    getEarliestBalances: unused,
    getPaymentsInto: unused,
    getOpeningBalancesAfter: unused,
    getBalanceAt: unused,
    getBalancesByAccount: unused,
    getBalancesAtDates: async (ids, dates) => {
      calls.push(`dates:${ids.join(",")}`);
      return dates.map((_, index) => ids.reduce((sum, id) => sum + id, 0) * 100 * (index + 1) * (ids.includes(3) ? -1 : 1));
    },
    getDailyBalanceSeries: async (ids, from, to) => [{ date: to, balanceCents: ids.length * 1000 }, { date: from, balanceCents: -5 }],
    getFlowForDateRange: unused,
    getMonthlyFlowRange: async () => [{ month: "2026-09-01", incomeCents: 500, expenseCents: -200 }],
    getDailyFlow: async () => [{ date: "2026-10-05", incomeCents: 70, expenseCents: -30 }],
  };
}

test("balance mensual: suma las cuentas de activos en una sola lectura por lote", async () => {
  const calls: string[] = [];
  const series = await new GetFinancialEvolutionUseCase(fakeRepo(calls)).execute(1, "balance", "3m", TODAY);
  assert.deepEqual(series.map((p) => p.value), [300, 600, 900]);
  assert.deepEqual(calls, ["dates:1,2"]);
});

test("patrimonio incluye activos, tarjetas y otros pasivos en ese orden", async () => {
  const calls: string[] = [];
  await new GetFinancialEvolutionUseCase(fakeRepo(calls)).execute(1, "netWorth", "3m", TODAY);
  assert.deepEqual(calls, ["dates:1,2,3,4"]);
});

test("deuda: valores absolutos de tarjetas y otros pasivos", async () => {
  const series = await new GetFinancialEvolutionUseCase(fakeRepo()).execute(1, "debt", "3m", TODAY);
  assert.deepEqual(series.map((p) => p.value), [700, 1400, 2100]);
});

test("ingresos y gastos: diario toma el flujo del día y mensual rellena con cero los meses sin datos", async () => {
  const useCase = new GetFinancialEvolutionUseCase(fakeRepo());
  assert.deepEqual(await useCase.execute(1, "income", "30d", TODAY), [{ date: "2026-10-05", value: 70 }]);
  assert.deepEqual(await useCase.execute(1, "expense", "30d", TODAY), [{ date: "2026-10-05", value: 30 }]);
  const monthlyExpense = await useCase.execute(1, "expense", "3m", TODAY);
  assert.deepEqual(monthlyExpense.map((p) => p.value), [0, 200, 0]);
  const monthlyIncome = await useCase.execute(1, "income", "3m", TODAY);
  assert.deepEqual(monthlyIncome.map((p) => p.value), [0, 500, 0]);
});

test("ahorro mensual: diferencias entre saldos consecutivos incluyendo el mes previo", async () => {
  const calls: string[] = [];
  const series = await new GetFinancialEvolutionUseCase(fakeRepo(calls)).execute(1, "savings", "3m", TODAY);
  assert.equal(series.length, 3);
  assert.deepEqual(calls, ["dates:2"]);
  assert.deepEqual(series.map((p) => p.value), [200, 200, 200]);
});
