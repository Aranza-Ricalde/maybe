import assert from "node:assert/strict";
import { test } from "node:test";
import { RECOMMENDED_STRUCTURE, planReorganization, type ReorgCategory, type ReorgConcept, type ReorgOp } from "./reorganization";
import { InvalidCategoryError } from "./rules";

const c = (id: number, name: string, parentId: number | null, classification: "expense" | "income" = "expense"): ReorgCategory => ({ id, name, parentId, classification, color: "#111111" });

// Las categorías reales (ids de producción) relevantes para la reorganización.
const CATEGORIES: ReorgCategory[] = [
  c(38, "Salario", null, "income"),
  c(39, "Compras", null),
  c(42, "Transporte", null),
  c(43, "Vivienda", null),
  c(44, "Gimnasio", null),
  c(45, "Streaming", null),
  c(49, "Auto", null),
  c(51, "Renta", 43),
  c(52, "Mudanza y depósito", 43),
  c(53, "Mantenimiento y reparaciones", 43),
  c(54, "Servicios", 43),
  c(57, "Entretenimiento", null),
  c(60, "Ahorro", null),
  c(47, "Ahorro Emergencia", 60),
  c(61, "Despensa", null),
  c(62, "Restaurantes", null),
  c(64, "Apuestas y juegos de azar", null),
];
const CONCEPTS: ReorgConcept[] = [
  { id: 4, name: "Teléfono", categoryId: 54 },
  { id: 5, name: "Renta de la casa", categoryId: 51 },
  { id: 6, name: "Luz", categoryId: 43 },
  { id: 7, name: "Internet Casa", categoryId: 43 },
  { id: 8, name: "Agua", categoryId: 43 },
];

function plan(ops: ReorgOp[] = RECOMMENDED_STRUCTURE, categories = CATEGORIES, concepts = CONCEPTS) {
  return planReorganization({ familyId: 1, categories, concepts, ops });
}

const finalOf = (p: ReturnType<typeof plan>, name: string) => p.finalCategories.find((x) => x.name === name)!;
const nameOf = (p: ReturnType<typeof plan>, id: number | null) => (id == null ? null : p.finalCategories.find((x) => x.id === id)?.name);

test("la estructura recomendada, aplicada a tus categorías, deja el árbol que acordamos", () => {
  const p = plan();
  assert.equal(nameOf(p, finalOf(p, "Despensa").parentId), "Alimentación");
  assert.equal(nameOf(p, finalOf(p, "Restaurantes").parentId), "Alimentación");
  assert.equal(nameOf(p, finalOf(p, "Auto").parentId), "Transporte");
  assert.equal(nameOf(p, finalOf(p, "Suscripciones y streaming").parentId), "Ocio");
  assert.equal(nameOf(p, finalOf(p, "Apuestas y juegos de azar").parentId), "Ocio");
  assert.equal(nameOf(p, finalOf(p, "Gimnasio y bienestar").parentId), "Salud");
  assert.equal(finalOf(p, "Servicios").parentId, null);
  assert.equal(nameOf(p, finalOf(p, "Internet").parentId), "Servicios");
  assert.equal(finalOf(p, "Compras personales").parentId, null);
});

test("los conceptos pasan a su subcategoría de servicio y Renta se queda donde estaba", () => {
  const p = plan();
  const categoryOf = (concept: string) => nameOf(p, p.finalConcepts.find((x) => x.name === concept)!.categoryId);
  assert.equal(categoryOf("Luz"), "Electricidad");
  assert.equal(categoryOf("Agua"), "Agua");
  assert.equal(categoryOf("Internet Casa"), "Internet");
  assert.equal(categoryOf("Teléfono"), "Telefonía");
  assert.equal(categoryOf("Renta de la casa"), "Renta");
});

test("no toca lo que no se pidió: Vivienda y sus hijas, Ahorro, Salario", () => {
  const p = plan();
  for (const [name, parent] of [["Vivienda", null], ["Renta", "Vivienda"], ["Mantenimiento y reparaciones", "Vivienda"], ["Ahorro", null], ["Ahorro Emergencia", "Ahorro"], ["Salario", null]] as const) {
    assert.equal(nameOf(p, finalOf(p, name).parentId) ?? null, parent, name);
  }
  assert.equal(p.steps.some((s) => s.type === "rename" && ["Vivienda", "Ahorro", "Salario"].includes(s.from)), false);
});

test("idempotente: aplicar el plan dos veces no hace nada la segunda vez", () => {
  const first = plan();
  assert.ok(first.steps.length > 10);

  // Se "guarda" el resultado: los ids temporales pasan a ser ids reales, también donde otras categorías los referencian.
  const realId = new Map(first.finalCategories.filter((x) => x.id < 0).map((x, i) => [x.id, 1000 + i]));
  const remap = (id: number) => realId.get(id) ?? id;
  const saved = first.finalCategories.map((x) => ({ ...x, id: remap(x.id), parentId: x.parentId == null ? null : remap(x.parentId) }));
  const savedConcepts = first.finalConcepts.map((k) => ({ ...k, categoryId: remap(k.categoryId) }));

  const second = plan(RECOMMENDED_STRUCTURE, saved, savedConcepts);
  assert.equal(second.steps.length, 0, JSON.stringify(second.steps));
});

test("las categorías nuevas heredan el tipo y el color de su madre (las principales llevan el suyo)", () => {
  const p = plan();
  assert.equal(finalOf(p, "Alimentación").color, "#d97706");
  assert.equal(finalOf(p, "Delivery").color, "#d97706");
  assert.equal(finalOf(p, "Delivery").classification, "expense");
});

test("cada paso respeta las reglas de jerarquía: no se puede colgar una categoría con hijas bajo otra", () => {
  assert.throws(() => plan([{ kind: "move", name: "Vivienda", parent: "Transporte" }]), InvalidCategoryError);
  assert.throws(() => plan([{ kind: "move", name: "Salario", parent: "Transporte" }]), InvalidCategoryError);
  assert.throws(() => plan([{ kind: "move", name: "Renta", parent: "Servicios" }]), InvalidCategoryError);
});

test("una categoría que no existe es un error claro, no un cambio a medias", () => {
  assert.throws(() => plan([{ kind: "move", name: "No existe", parent: null }]), InvalidCategoryError);
});

test("nunca borra: todos los pasos son crear, renombrar, mover o reasignar un concepto", () => {
  const types = new Set(plan().steps.map((s) => s.type));
  assert.deepEqual([...types].sort(), ["assignConcept", "create", "move", "rename"]);
});

test("un concepto inexistente se omite sin romper el plan", () => {
  const p = plan([{ kind: "assignConcept", concept: "Gas natural", category: "Servicios" }]);
  assert.equal(p.steps.length, 0);
  assert.equal(p.alreadyDone.length, 1);
});
