export interface DayFlow {
  date: string;
  incomeCents: number;
  expenseCents: number;
}

export function lastDaysFlow(series: Array<{ key: string; incomeCents: number; expenseCents: number }>, today: string, days: number): DayFlow[] {
  return series
    .filter((point) => point.key <= today)
    .slice(-days)
    .map((point) => ({ date: point.key, incomeCents: point.incomeCents, expenseCents: point.expenseCents }));
}
