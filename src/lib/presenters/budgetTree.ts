export interface BudgetTreeRow {
  categoryId: number;
  parentId: number | null;
  hasChildren: boolean;
  effectiveBudgetedCents: number;
  actualCents: number;
}

export type VisibleBudgetRow<T extends BudgetTreeRow> = T & { isExpanded: boolean; childrenOverCount: number };

export function countOverChildren(rows: BudgetTreeRow[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of rows) {
    if (row.parentId != null && row.effectiveBudgetedCents > 0 && Math.abs(row.actualCents) > row.effectiveBudgetedCents) {
      counts.set(row.parentId, (counts.get(row.parentId) ?? 0) + 1);
    }
  }
  return counts;
}

export function visibleBudgetRows<T extends BudgetTreeRow>(rows: T[], expanded: ReadonlySet<number>): VisibleBudgetRow<T>[] {
  const over = countOverChildren(rows);
  return rows
    .filter((row) => row.parentId == null || expanded.has(row.parentId))
    .map((row) => ({ ...row, isExpanded: expanded.has(row.categoryId), childrenOverCount: over.get(row.categoryId) ?? 0 }));
}

export function toggleExpanded(expanded: ReadonlySet<number>, categoryId: number): ReadonlySet<number> {
  const next = new Set(expanded);
  if (!next.delete(categoryId)) next.add(categoryId);
  return next;
}

export function parentIds(rows: BudgetTreeRow[]): number[] {
  return rows.filter((row) => row.hasChildren).map((row) => row.categoryId);
}

export function areAllExpanded(rows: BudgetTreeRow[], expanded: ReadonlySet<number>): boolean {
  const parents = parentIds(rows);
  return parents.length > 0 && parents.every((id) => expanded.has(id));
}

export function sortBudgetRows<T extends BudgetTreeRow>(rows: T[]): T[] {
  const groups: Array<{ root: T; children: T[] }> = [];
  for (const row of rows) {
    if (row.parentId == null) groups.push({ root: row, children: [] });
    else groups.find((group) => group.root.categoryId === row.parentId)?.children.push(row);
  }
  const hasBudget = (group: { root: T }) => group.root.effectiveBudgetedCents > 0;
  const ordered = [...groups.filter(hasBudget), ...groups.filter((group) => !hasBudget(group))];
  return ordered.flatMap((group) => [group.root, ...group.children]);
}
