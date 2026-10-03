import type { RecurringItemForProjection, ScheduledForProjection } from "./rules";

export interface CashflowRepository {
  getCurrentBalanceCents(accountIds: number[], asOfDate: string): Promise<number>;
  getActiveRecurringItems(familyId: number): Promise<RecurringItemForProjection[]>;
  getPlannedScheduled(familyId: number, fromDateExclusive: string, toDateInclusive: string): Promise<ScheduledForProjection[]>;
  getRecentMonthlyExpenseCents(familyId: number, beforeMonthStart: string, monthsBack: number): Promise<number[]>;
}
