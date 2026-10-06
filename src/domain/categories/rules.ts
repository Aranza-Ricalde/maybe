import { FLOWS, type Flow } from "@/domain/ledger/rules";
import { groupBy } from "@/domain/shared/collections";

export class InvalidCategoryError extends Error {}

export function assertValidCategoryName(name: string): void {
  if (!name.trim()) {
    throw new InvalidCategoryError("El nombre de la categoría no puede estar vacío.");
  }
}

export function assertValidCategoryClassification(classification: string): asserts classification is Flow {
  if (!FLOWS.includes(classification as Flow)) {
    throw new InvalidCategoryError(`Clasificación de categoría inválida: "${classification}".`);
  }
}

export const DEFAULT_CATEGORY_ICON = "tag";

export const NO_PARENT_FORM_VALUE = "none";

export interface CategoryParentCandidate {
  id: number;
  familyId: number;
  parentId: number | null;
  classification: Flow;
}

export interface CategoryParentValidationInput {
  categoryId?: number;
  familyId: number;
  classification: Flow;
  parentId: number | null;
  parent: CategoryParentCandidate | null;
  childClassifications: Flow[];
}

export function assertValidCategoryParent(input: CategoryParentValidationInput): void {
  const hasChildren = input.childClassifications.length > 0;

  if (input.parentId == null) {
    if (hasChildren && input.childClassifications.some((c) => c !== input.classification)) {
      throw new InvalidCategoryError("No puedes cambiar el tipo: sus subcategorías son de otro tipo.");
    }
    return;
  }

  if (input.categoryId != null && input.parentId === input.categoryId) {
    throw new InvalidCategoryError("Una categoría no puede ser su propia madre.");
  }
  if (!input.parent || input.parent.id !== input.parentId || input.parent.familyId !== input.familyId) {
    throw new InvalidCategoryError("La categoría madre no existe.");
  }
  if (input.parent.parentId != null) {
    throw new InvalidCategoryError("Solo hay dos niveles: la categoría madre no puede ser a su vez una subcategoría.");
  }
  if (hasChildren) {
    throw new InvalidCategoryError("Esta categoría ya tiene subcategorías, no puede convertirse en subcategoría.");
  }
  if (input.parent.classification !== input.classification) {
    throw new InvalidCategoryError("La subcategoría debe ser del mismo tipo (ingreso o gasto) que su categoría madre.");
  }
}

export interface CategoryTreeInput {
  id: number;
  name: string;
  parentId: number | null;
}

export type CategoryTreeRow<T extends CategoryTreeInput> = T & { depth: 0 | 1; hasChildren: boolean };

export function orderCategoriesAsTree<T extends CategoryTreeInput>(rows: T[]): CategoryTreeRow<T>[] {
  const ids = new Set(rows.map((r) => r.id));
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, "es");
  const isChildRow = (row: T) => row.parentId != null && ids.has(row.parentId) && row.parentId !== row.id;
  const childrenOf = groupBy(rows.filter(isChildRow), (row) => row.parentId as number);
  const roots = rows.filter((row) => !isChildRow(row));

  return roots.sort(byName).flatMap((root) => {
    const children = (childrenOf.get(root.id) ?? []).sort(byName);
    return [
      { ...root, depth: 0 as const, hasChildren: children.length > 0 },
      ...children.map((child) => ({ ...child, depth: 1 as const, hasChildren: false })),
    ];
  });
}

export const CATEGORY_PATH_SEPARATOR = " › ";

export function categoryOptionsWithHierarchy<T extends CategoryTreeInput>(rows: T[]): Array<T & { label: string }> {
  const nameById = new Map(rows.map((r) => [r.id, r.name]));
  return orderCategoriesAsTree(rows).map((row) => ({
    ...row,
    label: row.depth === 1 && row.parentId != null ? `${nameById.get(row.parentId)}${CATEGORY_PATH_SEPARATOR}${row.name}` : row.name,
  }));
}

export interface CategoryTotalInput {
  categoryId: number;
  totalCents: number;
}

export interface CategoryBreakdownRow {
  categoryId: number;
  name: string;
  totalCents: number;
  depth: 0 | 1;
  parentId: number | null;
}

export function categoryBreakdown(totals: CategoryTotalInput[], categories: CategoryTreeInput[]): CategoryBreakdownRow[] {
  const known = new Map(categories.map((c) => [c.id, c]));
  const totalById = new Map<number, number>();
  for (const t of totals) totalById.set(t.categoryId, (totalById.get(t.categoryId) ?? 0) + t.totalCents);

  const isChild = (c: CategoryTreeInput) => c.parentId != null && c.parentId !== c.id && known.has(c.parentId);
  const childrenOf = groupBy(categories.filter(isChild), (c) => c.parentId as number);

  const rows: Array<{ root: CategoryBreakdownRow; children: CategoryBreakdownRow[] }> = [];
  const placed = new Set<number>();

  for (const c of categories.filter((x) => !isChild(x))) {
    const children = (childrenOf.get(c.id) ?? [])
      .map((child) => ({ categoryId: child.id, name: child.name, totalCents: totalById.get(child.id) ?? 0, depth: 1 as const, parentId: c.id }))
      .filter((r) => r.totalCents !== 0)
      .sort((a, b) => Math.abs(b.totalCents) - Math.abs(a.totalCents));
    const ownCents = totalById.get(c.id) ?? 0;
    const rolled = ownCents + children.reduce((sum, r) => sum + r.totalCents, 0);
    if (rolled === 0) continue;
    rows.push({ root: { categoryId: c.id, name: c.name, totalCents: rolled, depth: 0, parentId: null }, children });
    placed.add(c.id);
    for (const child of childrenOf.get(c.id) ?? []) placed.add(child.id);
  }

  const orphanCents = [...totalById.entries()].filter(([id]) => !known.has(id)).reduce((sum, [, cents]) => sum + cents, 0);
  if (orphanCents !== 0) rows.push({ root: { categoryId: 0, name: "Otro", totalCents: orphanCents, depth: 0, parentId: null }, children: [] });

  return rows
    .sort((a, b) => Math.abs(b.root.totalCents) - Math.abs(a.root.totalCents))
    .flatMap((r) => [r.root, ...r.children]);
}
