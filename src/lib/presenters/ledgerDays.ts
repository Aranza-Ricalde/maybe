export function dayNetCents(rows: Array<{ kind: string; amountCents: number }>): number {
  return rows.filter((row) => row.kind === "standard").reduce((sum, row) => sum + row.amountCents, 0);
}
