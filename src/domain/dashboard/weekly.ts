import { addDays } from "@/domain/payPeriod/rules";

export interface DailyFlowInput {
  date: string;
  incomeCents: number;
  expenseCents: number;
}

export interface WeeklyFlow {
  from: string;
  to: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}

export function mondayOf(isoDate: string): string {
  const dayOfWeek = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return addDays(isoDate, -((dayOfWeek + 6) % 7));
}

export function weeklyFlow(days: DailyFlowInput[], periodStart: string, periodEnd: string): WeeklyFlow[] {
  const weeks = new Map<string, WeeklyFlow>();
  for (const day of days) {
    if (day.date < periodStart || day.date > periodEnd) continue;
    const key = mondayOf(day.date);
    const week = weeks.get(key) ?? { from: day.date, to: day.date, incomeCents: 0, expenseCents: 0, netCents: 0 };
    week.from = day.date < week.from ? day.date : week.from;
    week.to = day.date > week.to ? day.date : week.to;
    week.incomeCents += day.incomeCents;
    week.expenseCents += Math.abs(day.expenseCents);
    week.netCents = week.incomeCents - week.expenseCents;
    weeks.set(key, week);
  }
  return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, week]) => week);
}
