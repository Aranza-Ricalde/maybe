import assert from "node:assert/strict";
import { test } from "node:test";
import type { AccountsBalanceHistory } from "@/application/getAccountsBalanceHistory";
import { accountChange, accountChangeView, filterAccounts, accountSeries, accountSpark, groupAccounts, paymentDayLabel } from "./accounts";

test("las cuentas se agrupan en líquidas, tarjetas y préstamos, en ese orden y sin grupos vacíos", () => {
  const groups = groupAccounts([{ type: "loan" as const }, { type: "checking" as const }, { type: "savings" as const }]);
  assert.deepEqual(groups.map((group) => [group.key, group.rows.length]), [["liquid", 2], ["loans", 1]]);
  assert.equal(groupAccounts([{ type: "credit_card" as const }])[0].key, "credit");
});

test("la serie de una cuenta toma solo sus valores y respeta las fechas", () => {
  const history: AccountsBalanceHistory = { accounts: [], points: [{ date: "2026-10-01", a1: 10, a2: 5 }, { date: "2026-10-02", a2: 6 }, { date: "2026-10-03", a1: 12 }] };
  assert.deepEqual(accountSpark(history, 1), [10, 12]);
  assert.deepEqual(accountSeries(history, 1), [{ date: "2026-10-01", value: 10 }, { date: "2026-10-03", value: 12 }]);
});

test("una cuenta sin cambios en el periodo no dibuja mini gráfica", () => {
  const history: AccountsBalanceHistory = { accounts: [], points: [{ date: "2026-10-01", a1: 5 }, { date: "2026-10-02", a1: 5 }] };
  assert.deepEqual(accountSpark(history, 1), []);
});

test("el día de pago solo se muestra si existe", () => {
  assert.equal(paymentDayLabel(null), null);
  assert.equal(paymentDayLabel(15), "Paga el día 15");
});

test("el cambio de una cuenta es el último saldo menos el primero, y no existe con menos de dos puntos", () => {
  const history: AccountsBalanceHistory = { accounts: [], points: [{ date: "2026-10-01", a1: 10 }, { date: "2026-10-02", a1: 25 }, { date: "2026-10-01", a2: 5 }] };
  assert.equal(accountChange(history, 1), 15);
  assert.equal(accountChange(history, 2), null);
});

test("el cambio con porcentaje usa el primer saldo; con saldo inicial 0 no hay porcentaje", () => {
  const history: AccountsBalanceHistory = { accounts: [], points: [{ date: "2026-10-01", a1: 100, a2: 0 }, { date: "2026-10-02", a1: 125, a2: 40 }] };
  assert.deepEqual(accountChangeView(history, 1), { cents: 25, pct: 0.25 });
  assert.deepEqual(accountChangeView(history, 2), { cents: 40, pct: null });
});

test("el filtro de cuentas deja solo el grupo elegido", () => {
  const rows = [{ type: "checking" as const }, { type: "credit_card" as const }, { type: "loan" as const }];
  assert.equal(filterAccounts(rows, "all").length, 3);
  assert.deepEqual(filterAccounts(rows, "credit").map((row) => row.type), ["credit_card"]);
});
