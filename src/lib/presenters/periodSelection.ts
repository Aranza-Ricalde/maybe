export function togglePeriod(selected: ReadonlySet<number>, id: number, checked: boolean): ReadonlySet<number> {
  const next = new Set(selected);
  if (checked) next.add(id);
  else if (next.size > 1) next.delete(id);
  return next;
}

export function sortedIds(selected: ReadonlySet<number>): number[] {
  return [...selected].sort((a, b) => a - b);
}
