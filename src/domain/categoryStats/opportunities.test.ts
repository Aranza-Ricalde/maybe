import assert from "node:assert/strict";
import { test } from "node:test";
import { discretionaryActions } from "./opportunities";

const row = (categoryId: number, name: string, avgLast3Cents: number, discretionaryShare: number, depth: 0 | 1 = 0) => ({ categoryId, name, avgLast3Cents, discretionaryShare, depth });
const nature = (key: "essential" | "discretionary" | null, avgLast3Cents: number) => ({ nature: key, label: String(key), avgLast3Cents, windowCents: avgLast3Cents * 3, shareOfWindow: 0.5 });

test("sin gasto discrecional no hay acciones", () => {
  assert.equal(discretionaryActions({ rows: [], natures: [nature("essential", 100_000)] } as never), null);
  assert.equal(discretionaryActions({ rows: [], natures: [nature("discretionary", 0)] } as never), null);
});

test("recortar 10 % de lo discrecional da el ahorro mensual y anual, con las 3 categorías donde más se puede recortar", () => {
  const stats = {
    natures: [nature("essential", 800_000), nature("discretionary", 400_000)],
    rows: [row(1, "Ocio", 200_000, 1), row(2, "Alimentación", 500_000, 0.2), row(3, "Ropa", 90_000, 1), row(4, "Café", 10_000, 1), row(5, "Vivienda", 700_000, 0), row(6, "Sub", 50_000, 1, 1)],
  };
  const actions = discretionaryActions(stats as never)!;
  assert.equal(actions.monthlySavingCents, 40_000);
  assert.equal(actions.yearlySavingCents, 480_000);
  assert.deepEqual(actions.opportunities.map((o) => [o.name, o.discretionaryMonthlyCents]), [["Ocio", 200_000], ["Alimentación", 100_000], ["Ropa", 90_000]]);
});

test("el porcentaje de recorte es configurable", () => {
  const actions = discretionaryActions({ rows: [], natures: [nature("discretionary", 100_000)] } as never, 25)!;
  assert.equal(actions.monthlySavingCents, 25_000);
});
