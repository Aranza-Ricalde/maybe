import assert from "node:assert/strict";
import { test } from "node:test";
import { emergencyFund, isEmergencyFundGoalName, netWorthCents, netWorthChange, savingsRate, trendOf } from "./rules";

test("el patrimonio es activos más pasivos con signo, y puede ser negativo", () => {
  assert.equal(netWorthCents({ assetsCents: 12_164_058, liabilitiesCents: -16_915_510 }), -4_751_452);
  assert.equal(netWorthCents({ assetsCents: 500_000, liabilitiesCents: 0 }), 500_000);
});

test("el cambio de patrimonio dice si sube, baja o sigue igual", () => {
  assert.deepEqual(netWorthChange(-4_000_000, -5_000_000), { deltaCents: 1_000_000, trend: "up" });
  assert.deepEqual(netWorthChange(100, 300), { deltaCents: -200, trend: "down" });
  assert.equal(netWorthChange(50, 50).trend, "flat");
  assert.equal(trendOf(0), "flat");
});

test("la tasa de ahorro es lo ahorrado entre los ingresos (el ejemplo de principios.md: 4,000 de 20,000 = 20 %)", () => {
  assert.equal(savingsRate({ incomeCents: 2_000_000, savedCents: 400_000 }), 0.2);
  assert.equal(savingsRate({ incomeCents: 2_000_000, savedCents: -200_000 }), -0.1);
  assert.equal(savingsRate({ incomeCents: 2_000_000, savedCents: 0 }), 0);
});

test("sin ingresos no hay tasa de ahorro (no se divide entre cero ni se inventa)", () => {
  assert.equal(savingsRate({ incomeCents: 0, savedCents: 100_000 }), null);
  assert.equal(savingsRate({ incomeCents: -50, savedCents: 100 }), null);
});

test("el fondo de emergencia mide cuántos meses de gasto esencial cubre (el ejemplo: 1.8 meses)", () => {
  const r = emergencyFund({ fundCents: 1_800_000, essentialMonthlyCents: 1_000_000, targetMonths: 3 });
  assert.equal(r.coverageMonths, 1.8);
  assert.equal(r.progress, 0.6);
  assert.equal(r.missingCents, 1_200_000);
});

test("con la meta cumplida no falta nada y el avance pasa de 100 %", () => {
  const r = emergencyFund({ fundCents: 4_000_000, essentialMonthlyCents: 1_000_000, targetMonths: 3 });
  assert.equal(r.missingCents, 0);
  assert.ok((r.progress as number) > 1);
});

test("sin gasto esencial conocido no se calcula la cobertura", () => {
  for (const essential of [null, 0, -5]) {
    assert.deepEqual(emergencyFund({ fundCents: 100_000, essentialMonthlyCents: essential, targetMonths: 3 }), { coverageMonths: null, targetMonths: 3, progress: null, missingCents: null });
  }
});

test("un fondo negativo cuenta como cero de cobertura", () => {
  assert.equal(emergencyFund({ fundCents: -500, essentialMonthlyCents: 1_000, targetMonths: 3 }).coverageMonths, 0);
});

test("si el usuario definió una meta en pesos, esa manda: la meta en meses sale de ella", () => {
  const r = emergencyFund({ fundCents: 10_136_753, essentialMonthlyCents: 1_701_300, targetMonths: 3, targetCents: 9_440_643 });
  assert.equal(Math.round(r.targetMonths * 10) / 10, 5.5);
  assert.equal(r.missingCents, 0);
  const short = emergencyFund({ fundCents: 5_000_000, essentialMonthlyCents: 1_000_000, targetMonths: 3, targetCents: 8_000_000 });
  assert.equal(short.targetMonths, 8);
  assert.equal(short.missingCents, 3_000_000);
});

test("una meta llamada 'Fondo de Emergencia' (con o sin acentos) es el fondo de emergencia", () => {
  assert.equal(isEmergencyFundGoalName("Fondo de Emergencia"), true);
  assert.equal(isEmergencyFundGoalName("EMERGENCIAS"), true);
  assert.equal(isEmergencyFundGoalName("Viaje"), false);
});
