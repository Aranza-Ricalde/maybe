import assert from "node:assert/strict";
import { test } from "node:test";
import {
  availableToSpend,
  clampToPeriod,
  computeRunway,
  creditCardSummary,
  debtProgress,
  explainAvailableToSpend,
  financialStatus,
  goalProgress,
  shiftMonth,
  upcomingRecurringCommitments,
} from "./rules";

test("availableToSpend: resta compromisos conocidos, sin estimación estadística", () => {
  const result = availableToSpend({
    liquidBalanceCents: 1_000_000,
    upcomingCommitments: [{ amountCents: -300_000 }, { amountCents: 50_000 }],
    daysRemainingInPeriod: 10,
  });
  assert.equal(result.upcomingCommitmentsCents, -250_000);
  assert.equal(result.availableCents, 750_000);
  assert.equal(result.dailyRecommendedCents, 75_000);
});

test("availableToSpend: sin días restantes, dailyRecommendedCents es null (no se divide entre 0)", () => {
  const result = availableToSpend({ liquidBalanceCents: 100, upcomingCommitments: [], daysRemainingInPeriod: 0 });
  assert.equal(result.dailyRecommendedCents, null);
});

test("explainAvailableToSpend: reconcilia exactamente con availableToSpend usando los mismos insumos", () => {
  const liquidAccounts = [
    { name: "Cuenta Nómina", balanceCents: 800_000 },
    { name: "Efectivo", balanceCents: 50_000 },
  ];
  const recurringOccurrences = [
    { name: "Renta", expectedDate: "2026-10-15", expectedAmountCents: -600_000, status: "pending" as const },
    { name: "Ya pasó", expectedDate: "2026-10-03", expectedAmountCents: -100_000, status: "pending" as const },
    { name: "Nómina", expectedDate: "2026-10-20", expectedAmountCents: 2_000_000, status: "pending" as const },
  ];
  const scheduled = [{ name: "Dentista", scheduledDate: "2026-10-12", amountCents: -230_000 }];

  const explained = explainAvailableToSpend({ liquidAccounts, recurringOccurrences, scheduled, referenceDate: "2026-10-05" });

  const viaAvailableToSpend = availableToSpend({
    liquidBalanceCents: 850_000,
    upcomingCommitments: [{ amountCents: -600_000 }, { amountCents: -230_000 }],
    daysRemainingInPeriod: 25,
  });

  assert.equal(explained.liquidBalanceCents, 850_000);
  // El ingreso esperado (Nómina) NO cuenta como dinero disponible hasta que llega.
  assert.equal(explained.commitmentsCents, -830_000);
  assert.equal(explained.availableCents, viaAvailableToSpend.availableCents);
  assert.equal(explained.commitments.length, 2);
  assert.equal(explained.commitments[0].name, "Dentista");
  assert.equal(explained.commitments[0].date, "2026-10-12");
  assert.equal(explained.commitments[1].name, "Renta");
});

test("upcomingRecurringCommitments: un recurrente ya pagado (aunque sea antes de tiempo) o omitido no vuelve a restar", () => {
  const commitments = upcomingRecurringCommitments(
    [
      { name: "Pendiente", expectedDate: "2026-10-20", expectedAmountCents: -100, status: "pending" },
      { name: "Pagado antes de tiempo", expectedDate: "2026-10-20", expectedAmountCents: -200, status: "paid" },
      { name: "Omitido", expectedDate: "2026-10-20", expectedAmountCents: -300, status: "skipped" },
    ],
    "2026-10-05",
  );
  assert.deepEqual(commitments.map((c) => c.name), ["Pendiente"]);
});

test("upcomingRecurringCommitments: lo que vence hoy o ya venció se asume reflejado en el saldo real", () => {
  const commitments = upcomingRecurringCommitments(
    [
      { name: "Hoy", expectedDate: "2026-10-05", expectedAmountCents: -100, status: "pending" },
      { name: "Ayer", expectedDate: "2026-10-04", expectedAmountCents: -100, status: "pending" },
      { name: "Mañana", expectedDate: "2026-10-06", expectedAmountCents: -100, status: "pending" },
    ],
    "2026-10-05",
  );
  assert.deepEqual(commitments.map((c) => c.name), ["Mañana"]);
});

test("explainAvailableToSpend: un periodo que cruza de mes respeta la fecha real de cada ocurrencia", () => {
  const explained = explainAvailableToSpend({
    liquidAccounts: [{ name: "Cuenta Nómina", balanceCents: 1_000_000 }],
    recurringOccurrences: [
      { name: "Basura (fin de septiembre)", expectedDate: "2026-09-30", expectedAmountCents: -25_000, status: "pending" },
      { name: "Renta (inicio de octubre)", expectedDate: "2026-10-05", expectedAmountCents: -600_000, status: "pending" },
    ],
    scheduled: [],
    referenceDate: "2026-09-29",
  });

  assert.equal(explained.commitments.length, 2);
  assert.equal(explained.commitments.find((c) => c.name.startsWith("Basura"))?.date, "2026-09-30");
  assert.equal(explained.commitments.find((c) => c.name.startsWith("Renta"))?.date, "2026-10-05");
});

test("financialStatus: verde cuando el gasto va igual o por debajo del tiempo transcurrido", () => {
  const result = financialStatus({
    incomeCentsThisPeriod: 100_000,
    expenseCentsThisPeriod: -50_000,
    incomeCentsPriorPeriod: 100_000,
    expenseCentsPriorPeriod: -50_000,
    daysElapsedInPeriod: 15,
    daysInPeriod: 30,
    budgetedTotalCents: null,
  });
  assert.equal(result.level, "green");
});

test("financialStatus: rojo si la proyección lineal del ritmo actual supera el presupuesto", () => {
  const result = financialStatus({
    incomeCentsThisPeriod: 100_000,
    expenseCentsThisPeriod: -40_000,
    incomeCentsPriorPeriod: 100_000,
    expenseCentsPriorPeriod: -40_000,
    daysElapsedInPeriod: 10,
    daysInPeriod: 30,
    budgetedTotalCents: 100_000,
  });
  assert.equal(result.level, "red");
});

test("financialStatus: rojo si el gasto va muy por delante del tiempo transcurrido (sin presupuesto)", () => {
  const result = financialStatus({
    incomeCentsThisPeriod: 100_000,
    expenseCentsThisPeriod: -90_000,
    incomeCentsPriorPeriod: 100_000,
    expenseCentsPriorPeriod: -90_000,
    daysElapsedInPeriod: 15,
    daysInPeriod: 30,
    budgetedTotalCents: null,
  });
  assert.equal(result.level, "red");
});

test("financialStatus: amarillo cuando el gasto crece más rápido que el ingreso mes contra mes", () => {
  const result = financialStatus({
    incomeCentsThisPeriod: 100_000,
    expenseCentsThisPeriod: -55_000,
    incomeCentsPriorPeriod: 100_000,
    expenseCentsPriorPeriod: -30_000,
    daysElapsedInPeriod: 15,
    daysInPeriod: 30,
    budgetedTotalCents: null,
  });
  assert.equal(result.level, "yellow");
});

test("financialStatus: el mensaje de detalle siempre trae los porcentajes reales, no texto genérico", () => {
  const result = financialStatus({
    incomeCentsThisPeriod: 100_000,
    expenseCentsThisPeriod: -64_000,
    incomeCentsPriorPeriod: 100_000,
    expenseCentsPriorPeriod: -64_000,
    daysElapsedInPeriod: 71,
    daysInPeriod: 100,
    budgetedTotalCents: null,
  });
  assert.match(result.detail, /64%/);
  assert.match(result.detail, /71 de 100 días/);
});

test("financialStatus: sin ingresos este periodo pero con gasto real -> amarillo, y el detalle NO inventa un 0%", () => {
  const result = financialStatus({
    incomeCentsThisPeriod: 0,
    expenseCentsThisPeriod: -20_000,
    incomeCentsPriorPeriod: 100_000,
    expenseCentsPriorPeriod: -50_000,
    daysElapsedInPeriod: 1,
    daysInPeriod: 31,
    budgetedTotalCents: null,
  });
  assert.equal(result.level, "yellow");
  assert.doesNotMatch(result.detail, /%/);
  assert.match(result.detail, /sin ingresos registrados/);
});

test("financialStatus: sin ingresos ni gastos este periodo -> verde, detalle dice que no hay movimientos", () => {
  const result = financialStatus({
    incomeCentsThisPeriod: 0,
    expenseCentsThisPeriod: 0,
    incomeCentsPriorPeriod: 0,
    expenseCentsPriorPeriod: 0,
    daysElapsedInPeriod: 1,
    daysInPeriod: 31,
    budgetedTotalCents: null,
  });
  assert.equal(result.level, "green");
  assert.match(result.detail, /Sin movimientos registrados/);
});

test("computeRunway: sin disponible, rojo y 0 días", () => {
  const result = computeRunway({ availableCents: 0, dailyBurnRateCents: 5_000, daysRemainingInPeriod: 10 });
  assert.equal(result.level, "red");
  assert.equal(result.runwayDays, 0);
});

test("computeRunway: sin ritmo de gasto todavía, verde y runwayDays null (no 'alcanza para siempre')", () => {
  const result = computeRunway({ availableCents: 500_000, dailyBurnRateCents: 0, daysRemainingInPeriod: 20 });
  assert.equal(result.level, "green");
  assert.equal(result.runwayDays, null);
});

test("computeRunway: al ritmo actual alcanza hasta fin de mes -> verde", () => {
  const result = computeRunway({ availableCents: 300_000, dailyBurnRateCents: 10_000, daysRemainingInPeriod: 20 });
  assert.equal(result.level, "green");
  assert.equal(result.runwayDays, 30);
});

test("computeRunway: se acaba antes de fin de mes pero en más de la mitad del tiempo restante -> amarillo", () => {
  const result = computeRunway({ availableCents: 160_000, dailyBurnRateCents: 10_000, daysRemainingInPeriod: 20 });
  assert.equal(result.level, "yellow");
  assert.equal(result.runwayDays, 16);
});

test("computeRunway: se acaba en menos de la mitad del tiempo restante -> rojo", () => {
  const result = computeRunway({ availableCents: 80_000, dailyBurnRateCents: 10_000, daysRemainingInPeriod: 20 });
  assert.equal(result.level, "red");
  assert.equal(result.runwayDays, 8);
});

test("debtProgress: calcula cuánto se ha pagado desde el saldo más antiguo conocido", () => {
  const result = debtProgress(6_000_000, 10_000_000);
  assert.equal(result.paidCents, 4_000_000);
  assert.equal(result.percentPaid, 0.4);
});

test("debtProgress: sin saldo antiguo de referencia, no inventa un porcentaje", () => {
  assert.deepEqual(debtProgress(5000, 0), { paidCents: 0, percentPaid: 0 });
});

test("debtProgress: un saldo a favor no cuenta como deuda (se recibe ya en cero)", () => {
  assert.deepEqual(debtProgress(0, 1_000_000), { paidCents: 1_000_000, percentPaid: 1 });
});

test("explainAvailableToSpend: los compromisos extra (pago mínimo de deuda) restan de lo disponible", () => {
  const explained = explainAvailableToSpend({
    liquidAccounts: [{ name: "Nómina", balanceCents: 1_000_000 }],
    recurringOccurrences: [],
    scheduled: [],
    extraCommitments: [{ name: "Pago mínimo · hey Banco", amountCents: -300_000, date: "2026-10-12" }],
    referenceDate: "2026-10-06",
  });
  assert.equal(explained.availableCents, 700_000);
});

test("goalProgress: porcentaje normal, bajo el objetivo", () => {
  assert.deepEqual(goalProgress(300_000, 1_000_000), { currentCents: 300_000, percent: 0.3 });
});

test("goalProgress: nunca pasa de 100% aunque el saldo supere la meta", () => {
  assert.deepEqual(goalProgress(1_500_000, 1_000_000), { currentCents: 1_500_000, percent: 1 });
});

test("goalProgress: un saldo negativo (cuenta en descubierto) no resta progreso, se trata como 0", () => {
  assert.deepEqual(goalProgress(-50_000, 1_000_000), { currentCents: 0, percent: 0 });
});

test("goalProgress: sin monto objetivo válido, no inventa un porcentaje", () => {
  assert.deepEqual(goalProgress(100_000, 0), { currentCents: 100_000, percent: 0 });
});

test("creditCardSummary: nunca excede el límite ni baja de 0 si el uso superó el límite", () => {
  assert.deepEqual(creditCardSummary(2_000_000, 600_000), { limitCents: 2_000_000, usedCents: 600_000, availableCents: 1_400_000 });
  assert.equal(creditCardSummary(1_000_000, 1_500_000).availableCents, 0);
});

test("clampToPeriod: pasado->fin de periodo, futuro->inicio de periodo, dentro->se queda igual", () => {
  assert.equal(clampToPeriod("2026-11-05", "2026-10-01", "2026-10-31"), "2026-10-31");
  assert.equal(clampToPeriod("2026-09-05", "2026-10-01", "2026-10-31"), "2026-10-01");
  assert.equal(clampToPeriod("2026-10-15", "2026-10-01", "2026-10-31"), "2026-10-15");
});

test("shiftMonth: navega meses incluyendo cambio de año", () => {
  assert.equal(shiftMonth("2026-10-01", 1), "2026-11-01");
  assert.equal(shiftMonth("2026-10-01", -1), "2026-09-01");
  assert.equal(shiftMonth("2026-12-01", 1), "2027-01-01");
  assert.equal(shiftMonth("2026-01-01", -1), "2025-12-01");
});

