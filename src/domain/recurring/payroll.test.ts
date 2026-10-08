import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidPayrollError, buildPayrollPlan, inferPayrollSetup, isPayrollItem, paydaysFromPeriods, payrollNames, suggestedMonthlyDay, upcomingPeriodStarts } from "./payroll";

const periods = [
  { start: "2026-08-29", end: "2026-09-13" },
  { start: "2026-09-14", end: "2026-09-28" },
  { start: "2026-09-29", end: "2026-10-13" },
  { start: "2026-10-14", end: "2026-10-28" },
  { start: "2026-10-29", end: "2026-11-13" },
];

test("sincronizada, la quincenal cobra el primer día de cada periodo del mes de pago actual", () => {
  assert.deepEqual(paydaysFromPeriods(periods, "2026-10-05", "biweekly"), [29, 14]);
});

test("sincronizada, la mensual cobra el primer día del primer periodo del mes de pago", () => {
  assert.deepEqual(paydaysFromPeriods(periods, "2026-10-20", "monthly"), [29]);
});

test("si hoy cae fuera de los periodos usa el último que ya empezó", () => {
  assert.deepEqual(paydaysFromPeriods(periods, "2026-12-01", "monthly"), [29]);
  assert.deepEqual(paydaysFromPeriods([], "2026-12-01", "monthly"), []);
});

test("la nómina quincenal sincronizada es un solo recurrente anclado al inicio de cada periodo", () => {
  assert.deepEqual(buildPayrollPlan({ frequency: "biweekly", mode: "sync", manualDays: [], periods, today: "2026-10-05" }), [{ name: "Nómina", dayOfMonth: 0 }]);
});

test("la nómina mensual no se sincroniza: pide el día y sugiere el inicio del mes de pago", () => {
  assert.throws(() => buildPayrollPlan({ frequency: "monthly", mode: "sync", manualDays: [], periods, today: "2026-10-05" }), InvalidPayrollError);
  assert.equal(suggestedMonthlyDay(periods, "2026-10-20"), 29);
  assert.equal(suggestedMonthlyDay([], "2026-10-20"), null);
});

test("los próximos inicios de periodo salen de los periodos reales, no de un día fijo", () => {
  const real = [
    { start: "2026-09-29", end: "2026-10-13" },
    { start: "2026-10-14", end: "2026-10-29" },
    { start: "2026-10-30", end: "2026-11-12" },
    { start: "2026-11-13", end: "2026-11-26" },
  ];
  assert.deepEqual(upcomingPeriodStarts(real, "2026-10-07", 3), ["2026-10-14", "2026-10-30", "2026-11-13"]);
  assert.deepEqual(upcomingPeriodStarts(real, "2026-12-01", 3), []);
});

test("el plan manual valida cantidad, rango y repetidos", () => {
  const base = { mode: "manual" as const, periods, today: "2026-10-05" };
  assert.deepEqual(buildPayrollPlan({ ...base, frequency: "monthly", manualDays: [5] }), [{ name: "Nómina", dayOfMonth: 5 }]);
  assert.deepEqual(buildPayrollPlan({ ...base, frequency: "biweekly", manualDays: [20, 5] }), [
    { name: "Nómina · 1ª quincena", dayOfMonth: 5 },
    { name: "Nómina · 2ª quincena", dayOfMonth: 20 },
  ]);
  assert.throws(() => buildPayrollPlan({ ...base, frequency: "biweekly", manualDays: [5] }), InvalidPayrollError);
  assert.throws(() => buildPayrollPlan({ ...base, frequency: "monthly", manualDays: [32] }), InvalidPayrollError);
  assert.throws(() => buildPayrollPlan({ ...base, frequency: "biweekly", manualDays: [5, 5] }), InvalidPayrollError);
});

test("sincronizar sin periodos por delante falla con un mensaje claro", () => {
  assert.throws(() => buildPayrollPlan({ frequency: "biweekly", mode: "sync", manualDays: [], periods: [periods[0]], today: "2027-01-01" }), /no hay periodos de pago por delante/);
});

test("reconoce los recurrentes de nómina por su nombre y que sean ingresos", () => {
  assert.equal(isPayrollItem({ name: "Nómina · 1ª quincena", flow: "income" }), true);
  assert.equal(isPayrollItem({ name: "Nómina", flow: "expense" }), false);
  assert.equal(isPayrollItem({ name: "Netflix", flow: "income" }), false);
  assert.deepEqual(payrollNames("monthly"), ["Nómina"]);
});

test("infiere la configuración a partir de los recurrentes activos", () => {
  const item = (name: string, dayOfMonth: number, status = "active") => ({ name, flow: "income", estimatedAmountCents: 1500000, dayOfMonth, accountId: 4, status });
  assert.deepEqual(inferPayrollSetup([item("Nómina · 2ª quincena", 29), item("Nómina · 1ª quincena", 14)]), { frequency: "biweekly", mode: "manual", days: [14, 29], amountCents: 1500000, accountId: 4 });
  assert.deepEqual(inferPayrollSetup([item("Nómina", 0)]), { frequency: "biweekly", mode: "sync", days: [], amountCents: 1500000, accountId: 4 });
  assert.equal(inferPayrollSetup([item("Nómina", 1)])?.frequency, "monthly");
  assert.equal(inferPayrollSetup([item("Nómina", 1, "paused")]), null);
  assert.equal(inferPayrollSetup([]), null);
});

test("los próximos cobros se ordenan por fecha y cruzan de mes", async () => {
  const { upcomingPaydays } = await import("./payroll");
  assert.deepEqual(upcomingPaydays([14, 29], "2026-10-05", 4), ["2026-10-14", "2026-10-29", "2026-11-14", "2026-11-29"]);
  assert.deepEqual(upcomingPaydays([14, 29], "2026-10-20", 3), ["2026-10-29", "2026-11-14", "2026-11-29"]);
});

test("un día 31 se ajusta al último día de los meses cortos y sin días válidos no hay cobros", async () => {
  const { upcomingPaydays } = await import("./payroll");
  assert.deepEqual(upcomingPaydays([31], "2026-11-05", 2), ["2026-11-30", "2026-12-31"]);
  assert.deepEqual(upcomingPaydays([], "2026-11-05", 3), []);
  assert.deepEqual(upcomingPaydays([40], "2026-11-05", 3), []);
});

test("las fechas de cobro salen de los periodos si está sincronizada y de los días si es manual", async () => {
  const { upcomingPayrollDates } = await import("./payroll");
  const real = [
    { start: "2026-10-14", end: "2026-10-29" },
    { start: "2026-10-30", end: "2026-11-12" },
    { start: "2026-11-13", end: "2026-11-26" },
  ];
  assert.deepEqual(upcomingPayrollDates({ frequency: "biweekly", mode: "sync", days: [] }, real, "2026-10-07", 3), ["2026-10-14", "2026-10-30", "2026-11-13"]);
  assert.deepEqual(upcomingPayrollDates({ frequency: "monthly", mode: "manual", days: [5] }, real, "2026-10-07", 2), ["2026-11-05", "2026-12-05"]);
});
