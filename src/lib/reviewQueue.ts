export function clampIndex(index: number, total: number): number {
  return total === 0 ? 0 : Math.min(Math.max(index, 0), total - 1);
}

export function stepIndex(current: number, delta: number, total: number): number {
  return total === 0 ? 0 : (((current + delta) % total) + total) % total;
}
