import assert from "node:assert/strict";
import { test } from "node:test";
import { MONTH_OPTIONS, describeAdjustment } from "./projectionScenario";

const name = () => "Ocio";

test("describe un recorte de categoría con su porcentaje", () => {
  assert.equal(describeAdjustment({ kind: "cut_category", categoryId: 1, percent: 20 }, name), "Recortar Ocio 20%");
});

test("distingue gasto de ingreso por el signo del monto", () => {
  assert.match(describeAdjustment({ kind: "monthly_change", amountCents: -50000, fromMonth: 2 }, name), /^Gasto de \$500/);
  assert.match(describeAdjustment({ kind: "one_time", amountCents: 50000, month: 3 }, name), /^Ingreso único/);
});

test("el primer mes se llama 'El mes siguiente'", () => {
  assert.equal(MONTH_OPTIONS[0].label, "El mes siguiente");
  assert.equal(MONTH_OPTIONS[1].label, "En 2 meses");
});
