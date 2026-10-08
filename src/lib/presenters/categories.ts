export function topLevelCategories<T extends { depth: number }>(rows: T[]): T[] {
  return rows.filter((row) => row.depth === 0);
}

export function parentOptionsFor<T extends { id: number; name: string; depth: number }>(rows: T[], excludeId: number, hasChildren: boolean): { value: string; label: string }[] {
  if (hasChildren) return [];
  return topLevelCategories(rows)
    .filter((parent) => parent.id !== excludeId)
    .map((parent) => ({ value: String(parent.id), label: parent.name }));
}
