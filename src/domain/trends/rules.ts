import { shiftMonth } from "@/domain/dashboard/rules";

export const MIN_MONTHS_FOR_AVERAGE = 2;
export const MIN_MONTHS_FOR_SIX_MONTH_AVERAGE = 4;

export type TrendKey = "previousMonth" | "avg3" | "avg6" | "yearAgo";

export interface MonthlyTotal {
  month: string;
  expenseCents: number;
}

export interface TrendComparison {
  key: TrendKey;
  label: string;
  baselineCents: number;
  deltaCents: number;
  deltaPct: number | null;
  monthsUsed: number;
}

export interface TrendSummary {
  month: string;
  lastCents: number;
  comparisons: TrendComparison[];
}

const average = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) / values.length);

export function buildTrendSummary(monthlyTotals: MonthlyTotal[], currentMonth: string): TrendSummary | null {
  const month = shiftMonth(currentMonth, -1);
  const byMonth = new Map(monthlyTotals.filter((m) => m.expenseCents > 0).map((m) => [m.month, m.expenseCents]));
  const lastCents = byMonth.get(month);
  if (lastCents == null) return null;

  const compare = (key: TrendKey, label: string, values: number[]): TrendComparison => {
    const baselineCents = values.length === 1 ? values[0] : average(values);
    const deltaCents = lastCents - baselineCents;
    return { key, label, baselineCents, deltaCents, deltaPct: baselineCents > 0 ? deltaCents / baselineCents : null, monthsUsed: values.length };
  };

  const before = (count: number) =>
    Array.from({ length: count }, (_, i) => byMonth.get(shiftMonth(month, -(i + 1)))).filter((v): v is number => v != null);

  const comparisons: TrendComparison[] = [];
  const previous = byMonth.get(shiftMonth(month, -1));
  if (previous != null) comparisons.push(compare("previousMonth", "Mes anterior", [previous]));

  const three = before(3);
  if (three.length >= MIN_MONTHS_FOR_AVERAGE) comparisons.push(compare("avg3", `Promedio de los ${three.length} meses anteriores`, three));

  const six = before(6);
  if (six.length >= MIN_MONTHS_FOR_SIX_MONTH_AVERAGE && six.length > three.length) comparisons.push(compare("avg6", `Promedio de los ${six.length} meses anteriores`, six));

  const yearAgo = byMonth.get(shiftMonth(month, -12));
  if (yearAgo != null) comparisons.push(compare("yearAgo", "Mismo mes del año anterior", [yearAgo]));

  return comparisons.length > 0 ? { month, lastCents, comparisons } : null;
}
