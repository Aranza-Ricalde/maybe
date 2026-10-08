import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSpendingPace } from "./pace";

const input = { from: "2026-10-01", to: "2026-10-10", today: "2026-10-04", budgetCents: 1000_00, dailyExpenseCents: [{ date: "2026-10-01", expenseCents: 100_00 }, { date: "2026-10-03", expenseCents: 300_00 }] };

test("el gasto se acumula por día y el ritmo esperado reparte el presupuesto en partes iguales", () => {
  const pace = buildSpendingPace(input);
  assert.deepEqual(pace?.days.slice(0, 4).map((day) => day.spentCents), [100_00, 100_00, 400_00, 400_00]);
  assert.equal(pace?.days[4].spentCents, null);
  assert.equal(pace?.days[0].paceCents, 100_00);
  assert.equal(pace?.days[9].paceCents, 1000_00);
  assert.equal(pace?.expectedTodayCents, 400_00);
  assert.equal(pace?.daysElapsed, 4);
  assert.equal(pace?.daysRemaining, 6);
});

test("dentro del ritmo, por encima del ritmo y por encima del presupuesto", () => {
  assert.equal(buildSpendingPace(input)?.status, "on_track");
  assert.equal(buildSpendingPace({ ...input, budgetCents: 800_00 })?.status, "ahead");
  assert.equal(buildSpendingPace({ ...input, budgetCents: 300_00 })?.status, "over");
});

test("sin presupuesto no hay estado de ritmo", () => {
  assert.equal(buildSpendingPace({ ...input, budgetCents: 0 })?.status, "no_budget");
});

test("un periodo terminado ya no tiene días por delante y uno futuro no tiene gasto real", () => {
  const past = buildSpendingPace({ ...input, today: "2026-11-01" });
  assert.equal(past?.daysRemaining, 0);
  assert.equal(past?.spentCents, 400_00);
  const future = buildSpendingPace({ ...input, today: "2026-09-01" });
  assert.equal(future?.daysElapsed, 0);
  assert.equal(future?.days.every((day) => day.spentCents === null), true);
});
