import assert from "node:assert/strict";
import { test } from "node:test";
import { planProviderMerges } from "./merge";

const p = (id: number, name: string, references = 0) => ({ id, name, references });

test("fusiona duplicados exactos: acentos, mayúsculas y espacios no cambian la identidad", () => {
  const plan = planProviderMerges([p(1, "Nomina", 5), p(2, "Nómina", 1), p(3, "NU MEXICO", 2), p(4, "Nu México", 2), p(5, "Va y Ven"), p(6, "Vayven")]);
  assert.equal(plan.length, 3);
  assert.deepEqual(plan.map((g) => g.keep.name).sort(), ["Nu México", "Nómina", "Va y Ven"]);
});

test("se queda con el nombre que conserva los acentos aunque tenga menos referencias", () => {
  const [group] = planProviderMerges([p(1, "Nomina", 50), p(2, "Nómina", 1)]);
  assert.equal(group.keep.id, 2);
  assert.deepEqual(group.absorb.map((x) => x.id), [1]);
});

test("los acentos solo deciden contra su gemelo exacto, no contra un nombre que difiere en algo más", () => {
  const [group] = planProviderMerges([p(1, "¡Grácias por tu pago!", 1), p(2, "Gracias por tu pago", 1)]);
  assert.equal(group.keep.id, 2);
});

test("sin acentos de por medio, gana el más usado y luego el más antiguo", () => {
  assert.equal(planProviderMerges([p(1, "Vayven", 1), p(2, "Va y Ven", 9)])[0].keep.id, 2);
  assert.equal(planProviderMerges([p(7, "Uber", 3), p(3, "UBER", 3)])[0].keep.id, 3);
});

test("nunca fusiona parecidos: un comercio que contiene a otro sigue siendo otro", () => {
  assert.deepEqual(planProviderMerges([p(1, "Café"), p(2, "Café Chavalete"), p(3, "Oxxo"), p(4, "Oxxo Gas")]), []);
});

test("los proveedores únicos no generan plan y los sin letras se ignoran", () => {
  assert.deepEqual(planProviderMerges([p(1, "Netflix"), p(2, "123"), p(3, "456")]), []);
});
