import assert from "node:assert/strict";
import { test } from "node:test";
import { cashProjectionStatus, projectDailyBalance, recurringEvents, variableDailyRateCents } from "./daily";

const items = [
  { id: 1, name: "Nómina", dayOfMonth: 15, estimatedAmountCents: 1_000_000 },
  { id: 2, name: "Renta", dayOfMonth: 15, estimatedAmountCents: -600_000 },
  { id: 3, name: "Internet", dayOfMonth: 31, estimatedAmountCents: -49_900 },
];

test("las fechas futuras de los recurrentes en el rango, con el día 31 en el último día de meses cortos", () => {
  const events = recurringEvents(items, "2026-10-06", "2026-11-30");
  assert.deepEqual(events.map((e) => `${e.date} ${e.label}`), [
    "2026-10-15 Nómina",
    "2026-10-15 Renta",
    "2026-10-31 Internet",
    "2026-11-15 Nómina",
    "2026-11-15 Renta",
    "2026-11-30 Internet",
  ]);
});

test("lo de hoy y lo anterior no se vuelve a esperar; el límite final entra", () => {
  assert.deepEqual(recurringEvents(items, "2026-10-15", "2026-10-15"), []);
  assert.deepEqual(recurringEvents(items, "2026-10-14", "2026-10-15").map((e) => e.label), ["Nómina", "Renta"]);
});

test("lo que ya se pagó u omitió se descarta", () => {
  const events = recurringEvents(items, "2026-10-06", "2026-10-31", new Set(["2|2026-10-15"]));
  assert.deepEqual(events.map((e) => e.label), ["Nómina", "Internet"]);
});

test("cruza el cambio de año", () => {
  const events = recurringEvents(items, "2026-12-20", "2027-01-20");
  assert.deepEqual(events.map((e) => e.date), ["2026-12-31", "2027-01-15", "2027-01-15"]);
});

test("el gasto variable es el gasto promedio menos lo que explican los recurrentes, por día, y nunca positivo", () => {
  assert.equal(variableDailyRateCents(-3_000_000, -600_000), -80_000);
  assert.equal(variableDailyRateCents(-500_000, -600_000), 0);
});

test("proyecta el saldo día a día con eventos y gasto variable", () => {
  const events = recurringEvents(items, "2026-10-06", "2026-10-31");
  const p = projectDailyBalance({ startDate: "2026-10-06", startBalanceCents: 1_200_000, days: 30, events, dailyVariableCents: -10_000, minimumCents: 0 });
  assert.equal(p.series.length, 31);
  assert.equal(p.series[0].balanceCents, 1_200_000);
  // Día 9 (15 oct): +10,000 −6,000 de eventos y −90,000 de variable acumulado
  assert.equal(p.series[9].date, "2026-10-15");
  assert.equal(p.series[9].balanceCents, 1_200_000 + 1_000_000 - 600_000 - 90_000);
  assert.equal(p.endBalanceCents, 1_200_000 + 1_000_000 - 600_000 - 49_900 - 300_000);
  assert.equal(p.incomeCents, 1_000_000);
  assert.equal(p.expensesCents, -649_900);
  assert.equal(p.variableCents, -300_000);
  assert.equal(p.firstBelowMinimum, null);
});

test("detecta el primer día en que el saldo cae por debajo del mínimo (el ejemplo del documento)", () => {
  const p = projectDailyBalance({ startDate: "2026-10-06", startBalanceCents: 300_000, days: 30, events: [{ date: "2026-10-12", label: "Renta", amountCents: -400_000, source: "recurring" }], dailyVariableCents: 0, minimumCents: 100_000 });
  assert.equal(p.firstBelowMinimum?.date, "2026-10-12");
  assert.equal(p.firstBelowMinimum?.balanceCents, -100_000);
  assert.equal(p.lowest.balanceCents, -100_000);
});

test("el aviso: rojo si cruza el mínimo, verde si no, y sin ingresos no alarma sino que explica el supuesto", () => {
  const income = { date: "2026-10-20", label: "Nómina", amountCents: 500_000, source: "recurring" as const };
  const rent = { date: "2026-10-12", label: "Renta", amountCents: -400_000, source: "recurring" as const };
  const red = projectDailyBalance({ startDate: "2026-10-06", startBalanceCents: 300_000, days: 30, events: [rent, income], dailyVariableCents: 0, minimumCents: 0 });
  assert.equal(cashProjectionStatus(red, 0, 30).level, "red");
  assert.match(cashProjectionStatus(red, 0, 30).message, /cae por debajo de \$0 el 12 de oct/);

  const green = projectDailyBalance({ startDate: "2026-10-06", startBalanceCents: 900_000, days: 30, events: [rent, income], dailyVariableCents: 0, minimumCents: 0 });
  assert.equal(cashProjectionStatus(green, 0, 30).level, "green");

  const noIncome = projectDailyBalance({ startDate: "2026-10-06", startBalanceCents: 100_000, days: 30, events: [rent], dailyVariableCents: 0, minimumCents: 0 });
  const status = cashProjectionStatus(noIncome, 0, 30);
  assert.equal(status.level, "yellow");
  assert.match(status.message, /no incluye ingresos/);
});

test("los eventos fuera del horizonte no cuentan", () => {
  const p = projectDailyBalance({ startDate: "2026-10-06", startBalanceCents: 0, days: 10, events: [{ date: "2026-12-01", label: "x", amountCents: -999, source: "scheduled" }, { date: "2026-10-06", label: "hoy", amountCents: -5, source: "scheduled" }], dailyVariableCents: 0, minimumCents: 0 });
  assert.equal(p.endBalanceCents, 0);
  assert.equal(p.events.length, 0);
});
