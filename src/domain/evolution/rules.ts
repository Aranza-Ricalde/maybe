import { shiftMonth } from "@/domain/dashboard/rules";
import { endOfMonth } from "@/domain/cashflow/rules";
import { monthStart } from "@/domain/ledger/rules";

export type EvolutionMetric = "balance" | "netWorth" | "debt" | "income" | "expense" | "savings";
export type EvolutionRangeKey = "30d" | "3m" | "6m" | "1y";
export type Granularity = "daily" | "monthly";

export const EVOLUTION_METRICS: readonly EvolutionMetric[] = ["balance", "netWorth", "debt", "income", "expense", "savings"];
export const EVOLUTION_RANGES: readonly EvolutionRangeKey[] = ["30d", "3m", "6m", "1y"];

export interface EvolutionPoint {
  date: string;
  value: number;
}

export interface RangeBounds {
  granularity: Granularity;
  fromDate: string;
  months: string[];
}

const DAILY_RANGE_DAYS = 30;
const MONTHLY_RANGE_MONTHS: Record<Exclude<EvolutionRangeKey, "30d">, number> = { "3m": 3, "6m": 6, "1y": 12 };

export function shiftDays(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function rangeBounds(range: EvolutionRangeKey, today: string): RangeBounds {
  if (range === "30d") {
    return { granularity: "daily", fromDate: shiftDays(today, -(DAILY_RANGE_DAYS - 1)), months: [] };
  }
  const count = MONTHLY_RANGE_MONTHS[range];
  const currentMonth = monthStart(today);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(shiftMonth(currentMonth, -i));
  }
  return { granularity: "monthly", fromDate: months[0], months };
}

export function monthSampleDate(month: string, today: string): string {
  return month === monthStart(today) ? today : endOfMonth(month);
}

export function levelsToDeltas(levels: EvolutionPoint[]): EvolutionPoint[] {
  const deltas: EvolutionPoint[] = [];
  for (let i = 1; i < levels.length; i++) {
    deltas.push({ date: levels[i].date, value: levels[i].value - levels[i - 1].value });
  }
  return deltas;
}

export interface NamedSeries {
  key: string;
  points: EvolutionPoint[];
}

export function mergeSeriesByDate(series: NamedSeries[]): Array<Record<string, string | number>> {
  const dates = [...new Set(series.flatMap((entry) => entry.points.map((point) => point.date)))].sort();
  const byKey = series.map((entry) => ({ key: entry.key, values: new Map(entry.points.map((point) => [point.date, point.value])) }));
  return dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const entry of byKey) {
      const value = entry.values.get(date);
      if (value !== undefined) row[entry.key] = value;
    }
    return row;
  });
}
