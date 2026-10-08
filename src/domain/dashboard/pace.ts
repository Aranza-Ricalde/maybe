import { addDays } from "@/domain/payPeriod/rules";

export interface PaceDay {
  date: string;
  spentCents: number | null;
  paceCents: number;
}

export type PaceStatus = "no_budget" | "on_track" | "ahead" | "over";

export interface SpendingPace {
  days: PaceDay[];
  budgetCents: number;
  spentCents: number;
  expectedTodayCents: number;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  status: PaceStatus;
}

export interface BuildPaceInput {
  from: string;
  to: string;
  today: string;
  budgetCents: number;
  dailyExpenseCents: Array<{ date: string; expenseCents: number }>;
}

export const PACE_TOLERANCE = 1.1;

const MS_PER_DAY = 86_400_000;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);

export function buildSpendingPace({ from, to, today, budgetCents, dailyExpenseCents }: BuildPaceInput): SpendingPace | null {
  const daysTotal = daysBetween(from, to) + 1;
  if (daysTotal < 1) return null;
  const expenseByDate = new Map(dailyExpenseCents.map((entry) => [entry.date, entry.expenseCents]));
  const lastDay = today < from ? null : today > to ? to : today;
  const daysElapsed = lastDay ? daysBetween(from, lastDay) + 1 : 0;
  const paceAt = (dayNumber: number) => Math.round((budgetCents * dayNumber) / daysTotal);

  let cumulative = 0;
  const actual: number[] = [];
  for (let index = 0; index < daysElapsed; index++) {
    cumulative += expenseByDate.get(addDays(from, index)) ?? 0;
    actual.push(cumulative);
  }
  const expectedTodayCents = paceAt(daysElapsed);
  const days: PaceDay[] = Array.from({ length: daysTotal }, (_, index) => ({ date: addDays(from, index), spentCents: index < daysElapsed ? actual[index] : null, paceCents: paceAt(index + 1) }));

  const status: PaceStatus = budgetCents <= 0 ? "no_budget" : cumulative > budgetCents ? "over" : cumulative > expectedTodayCents * PACE_TOLERANCE ? "ahead" : "on_track";
  return { days, budgetCents, spentCents: cumulative, expectedTodayCents, daysElapsed, daysTotal, daysRemaining: Math.max(0, daysTotal - daysElapsed), status };
}
