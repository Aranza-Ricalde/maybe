import type { Flow } from "@/domain/ledger/rules";
import { InvalidCategoryError, assertValidCategoryParent } from "./rules";

export interface ReorgCategory {
  id: number;
  name: string;
  parentId: number | null;
  classification: Flow;
  color: string;
}

export interface ReorgConcept {
  id: number;
  name: string;
  categoryId: number;
}

export type ReorgOp =
  | { kind: "ensure"; name: string; parent: string | null; classification?: Flow; color?: string }
  | { kind: "rename"; from: string; to: string }
  | { kind: "move"; name: string; parent: string | null }
  | { kind: "assignConcept"; concept: string; category: string };

export type ReorgStep =
  | { type: "create"; tempId: number; name: string; parentId: number | null; classification: Flow; color: string }
  | { type: "rename"; id: number; from: string; to: string }
  | { type: "move"; id: number; name: string; fromParentId: number | null; parentId: number | null }
  | { type: "assignConcept"; conceptId: number; conceptName: string; fromCategoryId: number; categoryId: number };

export interface ReorgPlan {
  steps: ReorgStep[];
  alreadyDone: string[];
  finalCategories: ReorgCategory[];
  finalConcepts: ReorgConcept[];
}

const DEFAULT_ROOT_COLOR = "#64748b";

const normalize = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

export function planReorganization(input: { familyId: number; categories: ReorgCategory[]; concepts: ReorgConcept[]; ops: ReorgOp[] }): ReorgPlan {
  const categories = input.categories.map((c) => ({ ...c }));
  const concepts = input.concepts.map((c) => ({ ...c }));
  const steps: ReorgStep[] = [];
  const alreadyDone: string[] = [];
  let nextTempId = -1;

  const find = (name: string) => categories.find((c) => normalize(c.name) === normalize(name));
  const mustFind = (name: string) => {
    const found = find(name);
    if (!found) throw new InvalidCategoryError(`La categoría "${name}" no existe.`);
    return found;
  };
  const childrenOf = (id: number) => categories.filter((c) => c.parentId === id);
  const asParent = (c: ReorgCategory) => ({ id: c.id, familyId: input.familyId, parentId: c.parentId, classification: c.classification });

  for (const op of input.ops) {
    switch (op.kind) {
      case "ensure": {
        if (find(op.name)) {
          alreadyDone.push(`"${op.name}" ya existe`);
          break;
        }
        const parent = op.parent ? mustFind(op.parent) : null;
        const classification: Flow = op.classification ?? parent?.classification ?? "expense";
        assertValidCategoryParent({ familyId: input.familyId, classification, parentId: parent?.id ?? null, parent: parent ? asParent(parent) : null, childClassifications: [] });
        const created: ReorgCategory = { id: nextTempId--, name: op.name, parentId: parent?.id ?? null, classification, color: op.color ?? parent?.color ?? DEFAULT_ROOT_COLOR };
        categories.push(created);
        steps.push({ type: "create", tempId: created.id, name: created.name, parentId: created.parentId, classification, color: created.color });
        break;
      }
      case "rename": {
        const node = find(op.from);
        if (!node) {
          if (find(op.to)) alreadyDone.push(`"${op.from}" ya se llama "${op.to}"`);
          else throw new InvalidCategoryError(`La categoría "${op.from}" no existe.`);
          break;
        }
        if (normalize(node.name) === normalize(op.to) && node.name === op.to) break;
        const from = node.name;
        node.name = op.to;
        steps.push({ type: "rename", id: node.id, from, to: op.to });
        break;
      }
      case "move": {
        const node = mustFind(op.name);
        const parent = op.parent ? mustFind(op.parent) : null;
        if (node.parentId === (parent?.id ?? null)) {
          alreadyDone.push(`"${op.name}" ya está ${parent ? `bajo "${parent.name}"` : "como categoría principal"}`);
          break;
        }
        assertValidCategoryParent({
          categoryId: node.id,
          familyId: input.familyId,
          classification: node.classification,
          parentId: parent?.id ?? null,
          parent: parent ? asParent(parent) : null,
          childClassifications: childrenOf(node.id).map((c) => c.classification),
        });
        const fromParentId = node.parentId;
        node.parentId = parent?.id ?? null;
        steps.push({ type: "move", id: node.id, name: node.name, fromParentId, parentId: node.parentId });
        break;
      }
      case "assignConcept": {
        const concept = concepts.find((c) => normalize(c.name) === normalize(op.concept));
        if (!concept) {
          alreadyDone.push(`el concepto "${op.concept}" no existe (se omite)`);
          break;
        }
        const category = mustFind(op.category);
        if (concept.categoryId === category.id) {
          alreadyDone.push(`el concepto "${concept.name}" ya está en "${category.name}"`);
          break;
        }
        const fromCategoryId = concept.categoryId;
        concept.categoryId = category.id;
        steps.push({ type: "assignConcept", conceptId: concept.id, conceptName: concept.name, fromCategoryId, categoryId: category.id });
        break;
      }
    }
  }

  return { steps, alreadyDone, finalCategories: categories, finalConcepts: concepts };
}

export const RECOMMENDED_STRUCTURE: ReorgOp[] = [
  { kind: "ensure", name: "Alimentación", parent: null, classification: "expense", color: "#d97706" },
  { kind: "move", name: "Despensa", parent: "Alimentación" },
  { kind: "move", name: "Restaurantes", parent: "Alimentación" },
  { kind: "ensure", name: "Delivery", parent: "Alimentación" },
  { kind: "ensure", name: "Café y snacks", parent: "Alimentación" },

  { kind: "move", name: "Auto", parent: "Transporte" },

  { kind: "rename", from: "Entretenimiento", to: "Ocio" },
  { kind: "rename", from: "Streaming", to: "Suscripciones y streaming" },
  { kind: "move", name: "Suscripciones y streaming", parent: "Ocio" },
  { kind: "move", name: "Apuestas y juegos de azar", parent: "Ocio" },
  { kind: "ensure", name: "Salidas", parent: "Ocio" },

  { kind: "ensure", name: "Salud", parent: null, classification: "expense", color: "#db2777" },
  { kind: "rename", from: "Gimnasio", to: "Gimnasio y bienestar" },
  { kind: "move", name: "Gimnasio y bienestar", parent: "Salud" },

  { kind: "move", name: "Servicios", parent: null },
  { kind: "ensure", name: "Electricidad", parent: "Servicios" },
  { kind: "ensure", name: "Agua", parent: "Servicios" },
  { kind: "ensure", name: "Gas", parent: "Servicios" },
  { kind: "ensure", name: "Internet", parent: "Servicios" },
  { kind: "ensure", name: "Telefonía", parent: "Servicios" },
  { kind: "assignConcept", concept: "Luz", category: "Electricidad" },
  { kind: "assignConcept", concept: "Agua", category: "Agua" },
  { kind: "assignConcept", concept: "Internet Casa", category: "Internet" },
  { kind: "assignConcept", concept: "Teléfono", category: "Telefonía" },

  { kind: "rename", from: "Compras", to: "Compras personales" },
];
