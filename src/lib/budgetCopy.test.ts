import assert from "node:assert/strict";
import { test } from "node:test";
import { describeBudgetOrigin, describeCategory } from "./budgetCopy";

test("describeBudgetOrigin explica cada origen en lenguaje claro y no dice nada si no hay presupuesto", () => {
  assert.equal(describeBudgetOrigin({ kind: "none" }), null);
  assert.match(describeBudgetOrigin({ kind: "manual", amountCents: 45_000, cadence: "monthly" }) ?? "", /Tú fijaste \$450\.00 al mes/);
  assert.match(describeBudgetOrigin({ kind: "manual", amountCents: 45_000, cadence: "biweekly" }) ?? "", /por quincena/);
  assert.match(describeBudgetOrigin({ kind: "recurring" }) ?? "", /pagos recurrentes/);
  assert.match(describeBudgetOrigin({ kind: "children" }) ?? "", /subcategorías/);
  assert.match(describeBudgetOrigin({ kind: "raised", ownCapCents: 400_000 }) ?? "", /Tu tope era \$4,000\.00/);
  assert.match(describeBudgetOrigin({ kind: "cap", amountCents: 400_000, cadence: "monthly", unallocatedCents: 70_000 }) ?? "", /\$700\.00 sin asignar/);
  assert.doesNotMatch(describeBudgetOrigin({ kind: "cap", amountCents: 400_000, cadence: "monthly", unallocatedCents: 0 }) ?? "", /sin asignar/);
});

test("describeCategory usa la descripción y, si no hay ninguna, invita a agregarla en Configuración", () => {
  assert.equal(describeCategory("Delivery", { text: "Comida a domicilio: Uber Eats, Rappi.", isSuggested: true }), "Comida a domicilio: Uber Eats, Rappi.");
  assert.match(describeCategory("Mascotas", { text: null, isSuggested: false }), /Agrégala en Configuración → Categorías → Mascotas/);
});
