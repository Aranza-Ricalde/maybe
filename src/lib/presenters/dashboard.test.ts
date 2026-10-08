import assert from "node:assert/strict";
import { test } from "node:test";
import type { DashboardSummary } from "@/application/getDashboardSummary";
import { buildSpendingPace } from "@/domain/dashboard/pace";
import { buildDashboardMetrics, buildPaceChart, paceNotice, splitHeroAmount } from "./dashboard";

const pace = (budgetCents: number, today = "2026-10-04") => buildSpendingPace({ from: "2026-10-01", to: "2026-10-10", today, budgetCents, dailyExpenseCents: [{ date: "2026-10-01", expenseCents: 100_00 }, { date: "2026-10-03", expenseCents: 300_00 }] })!;
const savings = { rate: 0.1, previousRate: null, savedCents: 50_00, yieldCents: 2_60 } as DashboardSummary["savingsRate"];

test("el monto protagonista separa pesos y centavos y respeta el signo", () => {
  assert.deepEqual(splitHeroAmount(11418066), { whole: "$114,180", cents: ".66", negative: false });
  assert.deepEqual(splitHeroAmount(-5), { whole: "$0", cents: ".05", negative: true });
});

test("la gráfica de ritmo dibuja gasto y ritmo, con la línea del presupuesto y la marca de hoy", () => {
  const chart = buildPaceChart(pace(1000_00));
  assert.deepEqual(chart.series.map((series) => series.key), ["spent", "pace"]);
  assert.equal(chart.references[0].value, 1000_00);
  assert.equal(chart.data.length, 10);
  assert.ok(chart.marker);
  assert.equal(buildPaceChart(pace(0)).references.length, 0);
});

test("el aviso distingue sin presupuesto, ya superado, rumbo a pasarse y dentro de lo planeado", () => {
  assert.equal(paceNotice(pace(0)).tone, "muted");
  assert.equal(paceNotice(pace(300_00)).tone, "danger");
  assert.equal(paceNotice(pace(800_00)).tone, "warning");
  assert.equal(paceNotice(pace(1000_00)).tone, "success");
});

test("las métricas separan aportes y rendimientos y suman los días restantes solo cuando hay ritmo", () => {
  const period = { incomeCents: 900_00, expenseCents: 400_00 };
  const metrics = buildDashboardMetrics(pace(1000_00), period, savings);
  assert.deepEqual(metrics.map((metric) => metric.key), ["spent", "income", "contributed", "yield"]);
  assert.equal(metrics[0].hint, "40% del presupuesto · 6 días restantes");
  assert.equal(buildDashboardMetrics(null, period, savings)[0].hint, undefined);
  assert.equal(metrics[2].value, "+$50");
  assert.equal(metrics[3].value, "+$2.60");
});

import { movementChartData, weekdayLabel } from "./dashboard";

test("las barras de movimiento usan el día de la semana en español", () => {
  assert.equal(weekdayLabel("2026-10-07"), "mié");
  assert.deepEqual(movementChartData([{ date: "2026-10-05", incomeCents: 10, expenseCents: 4 }]), [{ label: "lun", moneyIn: 10, moneyOut: 4 }]);
});

import { movementTotals, spendingLimitView } from "./dashboard";

test("el límite de gasto topa la barra en 100 y marca el exceso", () => {
  assert.deepEqual(spendingLimitView({ budgetCents: 1000, spentCents: 1500 }), { budgetCents: 1000, spentCents: 1500, remainingCents: -500, barValue: 100, over: true });
  assert.equal(spendingLimitView(null).barValue, 0);
});

test("el movimiento de dinero suma entradas, salidas y flujo neto", () => {
  assert.deepEqual(movementTotals([{ incomeCents: 500, expenseCents: 200 }, { incomeCents: 0, expenseCents: 100 }]), { inCents: 500, outCents: 300, netCents: 200 });
});
