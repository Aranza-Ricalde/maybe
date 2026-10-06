import assert from "node:assert/strict";
import { test } from "node:test";
import { accountIdsByGoal, goalCurrentCents } from "./progress";

test("accountIdsByGoal agrupa las cuentas ligadas por meta", () => {
  const byGoal = accountIdsByGoal([{ goalId: 1, accountId: 10 }, { goalId: 1, accountId: 11 }, { goalId: 2, accountId: 12 }]);
  assert.deepEqual(byGoal.get(1), [10, 11]);
  assert.deepEqual(byGoal.get(2), [12]);
});

test("goalCurrentCents suma los saldos de sus cuentas y trata las desconocidas como cero", () => {
  assert.equal(goalCurrentCents([10, 11, 99], new Map([[10, 5000], [11, 2500]])), 7500);
});

import { goalRows, goalSummaries } from "./progress";

const GOALS = [
  { id: 1, name: "Viaje", targetAmountCents: 100_000, targetDate: "2027-01-01" },
  { id: 2, name: "Casa", targetAmountCents: 500_000, targetDate: null },
];

test("goalSummaries: toma lo actual y el mensaje de cada proyección; sin proyección queda en cero", () => {
  const summaries = goalSummaries(GOALS, [{ goalId: 1, currentCents: 25_000, projection: null, message: "ritmo" }]);
  assert.deepEqual(summaries, [
    { id: 1, name: "Viaje", targetAmountCents: 100_000, currentCents: 25_000, projection: "ritmo" },
    { id: 2, name: "Casa", targetAmountCents: 500_000, currentCents: 0, projection: null },
  ]);
});

test("goalRows: agrega fecha meta y los nombres de las cuentas ligadas", () => {
  const rows = goalRows(GOALS, new Map([[1, [10, 99]]]), [], new Map([[10, "Nu Ahorro"]]));
  assert.deepEqual(rows[0].linkedAccountNames, ["Nu Ahorro", "Cuenta 99"]);
  assert.equal(rows[0].targetDate, "2027-01-01");
  assert.deepEqual(rows[1].linkedAccountIds, []);
});
