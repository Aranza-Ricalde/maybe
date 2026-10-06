import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidScenarioError, projectBalance, type ProjectionBase } from "./rules";

const BASE: ProjectionBase = {
  currentMonth: "2026-10-01",
  startBalanceCents: 100_000_00,
  startNetWorthCents: -40_000_00,
  monthlyIncomeCents: 40_000_00,
  monthlyExpenseCents: 30_000_00,
  categories: [
    { id: 1, name: "Vivienda", avgMonthlyCents: 10_000_00, discretionaryShare: 0 },
    { id: 2, name: "Ocio", avgMonthlyCents: 5_000_00, discretionaryShare: 1 },
    { id: 3, name: "Alimentación", avgMonthlyCents: 8_000_00, discretionaryShare: 0.5 },
  ],
};

test("sin escenario, el saldo crece (o cae) por el ahorro mensual promedio", () => {
  const r = projectBalance(BASE, [], 3);
  assert.equal(r.baselineMonthlyNetCents, 10_000_00);
  assert.deepEqual(r.months.map((m) => m.month), ["2026-11-01", "2026-12-01", "2027-01-01"]);
  assert.equal(r.months[2].baselineBalanceCents, 130_000_00);
  assert.equal(r.differenceCents, 0);
  assert.equal(r.months[2].scenarioBalanceCents, r.months[2].baselineBalanceCents);
});

test("recortar una categoría ahorra ese porcentaje de su promedio cada mes", () => {
  const r = projectBalance(BASE, [{ kind: "cut_category", categoryId: 2, percent: 30 }], 6);
  assert.equal(r.months[0].scenarioEffectCents, 1_500_00);
  assert.equal(r.differenceCents, 1_500_00 * 6);
  assert.equal(r.scenarioMonthlyNetCents, 11_500_00);
});

test("recortar lo discrecional solo toca la parte discrecional de cada categoría", () => {
  // Ocio 100 % discrecional (5,000) y Alimentación 50 % (4,000 de 8,000): 20 % de 9,000 = 1,800
  const r = projectBalance(BASE, [{ kind: "cut_discretionary", percent: 20 }], 1);
  assert.equal(r.months[0].scenarioEffectCents, 1_800_00);
});

test("un recorte de categoría y uno discrecional se combinan sin contar dos veces el mismo gasto", () => {
  // Ocio: recorte 50 % y luego 20 % de lo discrecional sobre lo que queda: ahorra 5,000 × (1 − 0.5 × 0.8) = 3,000
  const r = projectBalance(BASE, [{ kind: "cut_category", categoryId: 2, percent: 50 }, { kind: "cut_discretionary", percent: 20 }], 1);
  const ocio = 5_000_00 * (1 - 0.5 * 0.8);
  const alimentacion = 8_000_00 * (1 - 0.9); // 20 % sobre su mitad discrecional = 10 %
  assert.equal(r.months[0].scenarioEffectCents, Math.round(ocio + alimentacion));
});

test("los recortes repetidos sobre la misma categoría nunca pasan de 100 %", () => {
  const r = projectBalance(BASE, [{ kind: "cut_category", categoryId: 1, percent: 80 }, { kind: "cut_category", categoryId: 1, percent: 80 }], 1);
  assert.equal(r.months[0].scenarioEffectCents, 10_000_00);
});

test("un gasto mensual nuevo empieza en su mes y un gasto único solo pega una vez", () => {
  const r = projectBalance(BASE, [{ kind: "monthly_change", amountCents: -2_000_00, fromMonth: 3 }, { kind: "one_time", amountCents: -15_000_00, month: 2 }], 4);
  assert.deepEqual(r.months.map((m) => m.scenarioEffectCents), [0, -15_000_00, -2_000_00, -2_000_00]);
  assert.equal(r.differenceCents, -15_000_00 - 2_000_00 * 2);
});

test("un ingreso nuevo suma", () => {
  const r = projectBalance(BASE, [{ kind: "monthly_change", amountCents: 3_000_00, fromMonth: 1 }], 2);
  assert.equal(r.differenceCents, 6_000_00);
});

test("el colchón son los meses que alcanza el saldo al ritmo de gasto de hoy", () => {
  assert.equal(projectBalance(BASE, [], 1).runwayMonths!.toFixed(2), (100_000_00 / 30_000_00).toFixed(2));
  assert.equal(projectBalance({ ...BASE, monthlyExpenseCents: 0 }, [], 1).runwayMonths, null);
  assert.equal(projectBalance({ ...BASE, startBalanceCents: -5_00 }, [], 1).runwayMonths, 0);
});

test("rechaza escenarios inválidos", () => {
  assert.throws(() => projectBalance(BASE, [{ kind: "cut_category", categoryId: 1, percent: 120 }]), InvalidScenarioError);
  assert.throws(() => projectBalance(BASE, [{ kind: "one_time", amountCents: -1, month: 99 }], 12), InvalidScenarioError);
  assert.throws(() => projectBalance(BASE, [{ kind: "monthly_change", amountCents: 10.5, fromMonth: 1 }]), InvalidScenarioError);
  assert.throws(() => projectBalance(BASE, [], 0), InvalidScenarioError);
  assert.throws(() => projectBalance(BASE, [], 99), InvalidScenarioError);
});

test("pagar deuda extra cada mes baja el saldo líquido y lo contabiliza como deuda pagada (el ejemplo: $2,000 extra)", () => {
  const r = projectBalance(BASE, [{ kind: "allocate", target: "debt", amountCents: 2_000_00, fromMonth: 1, repeat: true }], 6);
  assert.equal(r.months[0].scenarioEffectCents, -2_000_00);
  assert.equal(r.differenceCents, -2_000_00 * 6);
  assert.equal(r.allocatedToDebtCents, 12_000_00);
  assert.equal(r.allocatedToSavingsCents, 0);
});

test("ahorrar extra una sola vez pega una vez y se cuenta como ahorro, no como gasto", () => {
  const r = projectBalance(BASE, [{ kind: "allocate", target: "savings", amountCents: 1_000_00, fromMonth: 3, repeat: false }], 6);
  assert.deepEqual(r.months.map((m) => m.scenarioEffectCents), [0, 0, -1_000_00, 0, 0, 0]);
  assert.equal(r.allocatedToSavingsCents, 1_000_00);
});

test("destinar a deuda y a ahorro a la vez suma ambos efectos", () => {
  const r = projectBalance(
    BASE,
    [{ kind: "allocate", target: "debt", amountCents: 500_00, fromMonth: 2, repeat: true }, { kind: "allocate", target: "savings", amountCents: 300_00, fromMonth: 1, repeat: true }],
    3,
  );
  assert.deepEqual(r.months.map((m) => m.scenarioEffectCents), [-300_00, -800_00, -800_00]);
  assert.equal(r.allocatedToDebtCents, 1_000_00);
  assert.equal(r.allocatedToSavingsCents, 900_00);
});

test("destinar dinero rechaza montos no positivos, destinos raros y meses fuera de rango", () => {
  const bad = (a: Parameters<typeof projectBalance>[1]) => assert.throws(() => projectBalance(BASE, a, 6), InvalidScenarioError);
  bad([{ kind: "allocate", target: "debt", amountCents: 0, fromMonth: 1, repeat: true }]);
  bad([{ kind: "allocate", target: "debt", amountCents: -5, fromMonth: 1, repeat: true }]);
  bad([{ kind: "allocate", target: "casino" as "debt", amountCents: 100, fromMonth: 1, repeat: true }]);
  bad([{ kind: "allocate", target: "savings", amountCents: 100, fromMonth: 9, repeat: false }]);
});

test("el patrimonio proyectado crece con el ahorro mensual y puede partir de un valor negativo", () => {
  const r = projectBalance(BASE, [], 3);
  assert.equal(r.months[0].baselineNetWorthCents, -40_000_00 + 10_000_00);
  assert.equal(r.finalBaselineNetWorthCents, -40_000_00 + 30_000_00);
  assert.equal(r.finalScenarioNetWorthCents, r.finalBaselineNetWorthCents);
});

test("recortes e ingresos nuevos sí mueven el patrimonio; pagar deuda o ahorrar extra no (solo cambia el dinero de lugar)", () => {
  const cut = projectBalance(BASE, [{ kind: "cut_category", categoryId: 2, percent: 20 }], 4);
  assert.equal(cut.finalScenarioNetWorthCents - cut.finalBaselineNetWorthCents, 1_000_00 * 4);

  const alloc = projectBalance(BASE, [{ kind: "allocate", target: "debt", amountCents: 2_000_00, fromMonth: 1, repeat: true }], 4);
  assert.equal(alloc.finalScenarioNetWorthCents, alloc.finalBaselineNetWorthCents);
  assert.equal(alloc.differenceCents, -2_000_00 * 4); // pero el saldo líquido sí baja
});
