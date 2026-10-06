export function ratioOrZero(part: number, total: number): number {
  return total > 0 ? part / total : 0;
}
