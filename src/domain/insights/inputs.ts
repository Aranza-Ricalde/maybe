import type { CalendarOccurrenceInput } from "@/domain/calendar/rules";
import type { GoalProjection } from "@/domain/goals/projection";
import type { InsightGoal, InsightOccurrence } from "./rules";

export function paidOccurrencesForInsights(occurrences: CalendarOccurrenceInput[]): InsightOccurrence[] {
  return occurrences
    .filter((o) => o.status === "paid")
    .map((o) => ({ name: o.name, date: o.transaction?.date ?? o.expectedDate, expectedAmountCents: o.expectedAmountCents, actualAmountCents: o.transaction?.amountCents ?? null }));
}

export function goalsForInsights(
  goals: Array<{ id: number; name: string; targetDate: string | null }>,
  projectionByGoal: Map<number, GoalProjection | null>,
): InsightGoal[] {
  return goals.flatMap((g) => {
    const projection = projectionByGoal.get(g.id);
    return projection ? [{ name: g.name, targetDate: g.targetDate, projection }] : [];
  });
}
