import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InvalidSpendingNatureError,
  assertValidSpendingNature,
  effectiveNature,
  parseSpendingNatureFormValue,
  planNatureDefaults,
  type NatureCategory,
} from "./nature";

test("solo acepta naturalezas conocidas (o ninguna)", () => {
  assert.doesNotThrow(() => assertValidSpendingNature("essential"));
  assert.doesNotThrow(() => assertValidSpendingNature(null));
  assert.throws(() => assertValidSpendingNature("lujo"), InvalidSpendingNatureError);
});

test("el formulario: vacío o none es sin clasificar; un valor raro se rechaza", () => {
  assert.equal(parseSpendingNatureFormValue("essential"), "essential");
  assert.equal(parseSpendingNatureFormValue("none"), null);
  assert.equal(parseSpendingNatureFormValue(null), null);
  assert.equal(parseSpendingNatureFormValue(" "), null);
  assert.throws(() => parseSpendingNatureFormValue("xyz"), InvalidSpendingNatureError);
});

test("una subcategoría hereda la naturaleza de su madre salvo que tenga la propia", () => {
  const list: NatureCategory[] = [
    { id: 1, parentId: null, nature: "essential" },
    { id: 2, parentId: 1, nature: null },
    { id: 3, parentId: 1, nature: "discretionary" },
    { id: 4, parentId: null, nature: null },
    { id: 5, parentId: 4, nature: null },
  ];
  const byId = new Map(list.map((c) => [c.id, c]));
  const of = (id: number) => effectiveNature(byId.get(id) as NatureCategory, byId);
  assert.equal(of(2), "essential");
  assert.equal(of(3), "discretionary");
  assert.equal(of(5), null);
});

test("las sugerencias iniciales solo tocan gasto sin clasificar y de nombre conocido, sin acentos ni mayúsculas", () => {
  const plan = planNatureDefaults([
    { id: 1, name: "VIVIENDA", parentId: null, nature: null, classification: "expense" },
    { id: 2, name: "Café y snacks", parentId: 9, nature: null, classification: "expense" },
    { id: 3, name: "Ocio", parentId: null, nature: "essential", classification: "expense" },
    { id: 4, name: "Salario", parentId: null, nature: null, classification: "income" },
    { id: 5, name: "Cosas raras", parentId: null, nature: null, classification: "expense" },
    { id: 6, name: "Educacion", parentId: null, nature: null, classification: "expense" },
  ]);
  assert.deepEqual(plan.map((p) => [p.id, p.nature]), [[1, "essential"], [2, "discretionary"], [6, "essential"]]);
});
