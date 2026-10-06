import { and, desc, eq, gt, lte, sql } from "drizzle-orm";
import type { CashflowRepository } from "@/domain/cashflow/ports";
import type { RecurringItemForProjection, ScheduledForProjection } from "@/domain/cashflow/rules";
import { sumBalanceAsOf } from "./balances";
import { db } from "./client";
import { recurringItems, scheduledTransactions } from "./schema/budgeting";
import { incomeExpenseMonthly } from "./schema/aggregates";

export class DrizzleCashflowRepository implements CashflowRepository {
  async getCurrentBalanceCents(accountIds: number[], asOfDate: string): Promise<number> {
    return sumBalanceAsOf(accountIds, asOfDate);
  }

  async getActiveRecurringItems(familyId: number): Promise<RecurringItemForProjection[]> {
    const rows = await db
      .select({ id: recurringItems.id, name: recurringItems.name, dayOfMonth: recurringItems.dayOfMonth, estimatedAmountCents: recurringItems.estimatedAmountCents })
      .from(recurringItems)
      .where(and(eq(recurringItems.familyId, familyId), eq(recurringItems.status, "active")));
    return rows;
  }

  async getPlannedScheduled(
    familyId: number,
    fromDateExclusive: string,
    toDateInclusive: string,
  ): Promise<ScheduledForProjection[]> {
    const rows = await db
      .select({ name: scheduledTransactions.name, scheduledDate: scheduledTransactions.scheduledDate, amountCents: scheduledTransactions.amountCents })
      .from(scheduledTransactions)
      .where(
        and(
          eq(scheduledTransactions.familyId, familyId),
          eq(scheduledTransactions.status, "planned"),
          gt(scheduledTransactions.scheduledDate, fromDateExclusive),
          lte(scheduledTransactions.scheduledDate, toDateInclusive),
        ),
      );
    return rows;
  }

  async getRecentMonthlyExpenseCents(familyId: number, beforeMonthStart: string, monthsBack: number): Promise<number[]> {
    const rows = await db
      .select({ expenseCents: incomeExpenseMonthly.expenseCents })
      .from(incomeExpenseMonthly)
      .where(and(eq(incomeExpenseMonthly.familyId, familyId), sql`${incomeExpenseMonthly.month} < ${beforeMonthStart}`))
      .orderBy(desc(incomeExpenseMonthly.month))
      .limit(monthsBack);
    return rows.map((r) => r.expenseCents);
  }
}
