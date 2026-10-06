import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAdjustment, scenarioFormNeeds, type ScenarioFormValues } from "./scenarioForm";

const BASE: ScenarioFormValues = { kind: "cut_category", categoryId: "7", percent: "20", direction: "expense", amount: "", month: "1", repeat: "monthly" };

test("buildAdjustment: recorte de categoría con porcentaje válido", () => {
  assert.deepEqual(buildAdjustment(BASE), { kind: "cut_category", categoryId: 7, percent: 20 });
});

test("buildAdjustment: rechaza porcentaje fuera de rango o categoría vacía", () => {
  assert.equal(buildAdjustment({ ...BASE, percent: "0" }), null);
  assert.equal(buildAdjustment({ ...BASE, percent: "101" }), null);
  assert.equal(buildAdjustment({ ...BASE, categoryId: "" }), null);
});

test("buildAdjustment: gasto nuevo cada mes lleva el monto en centavos y con signo negativo", () => {
  assert.deepEqual(buildAdjustment({ ...BASE, kind: "monthly_change", amount: "1500.50", month: "2" }), { kind: "monthly_change", amountCents: -150_050, fromMonth: 2 });
});

test("buildAdjustment: un ingreso de una sola vez es positivo", () => {
  assert.deepEqual(buildAdjustment({ ...BASE, kind: "one_time", direction: "income", amount: "100", month: "3" }), { kind: "one_time", amountCents: 10_000, month: 3 });
});

test("buildAdjustment: pagar deuda extra cada mes", () => {
  assert.deepEqual(buildAdjustment({ ...BASE, kind: "allocate_debt", amount: "500", repeat: "monthly" }), { kind: "allocate", target: "debt", amountCents: 50_000, fromMonth: 1, repeat: true });
});

test("buildAdjustment: montos vacíos o no positivos se rechazan", () => {
  assert.equal(buildAdjustment({ ...BASE, kind: "one_time", amount: "" }), null);
  assert.equal(buildAdjustment({ ...BASE, kind: "one_time", amount: "-5" }), null);
});

test("scenarioFormNeeds: qué campos pide cada tipo", () => {
  assert.deepEqual(scenarioFormNeeds("allocate_savings"), { isAllocation: true, needsAmount: true, needsPercent: false });
  assert.deepEqual(scenarioFormNeeds("cut_discretionary"), { isAllocation: false, needsAmount: false, needsPercent: true });
});
