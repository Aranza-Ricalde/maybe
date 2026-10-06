import { and, count, eq, gte, isNull, lt, sql } from "drizzle-orm";
import type { InsightsRepository } from "@/domain/insights/ports";
import type { InsightExpense } from "@/domain/insights/rules";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { categories } from "./schema/classification";
import { transactions } from "./schema/transactions";

export class DrizzleInsightsRepository implements InsightsRepository {
  async listExpensesSince(familyId: number, fromDate: string): Promise<InsightExpense[]> {
    return db
      .select({
        id: transactions.id,
        date: transactions.date,
        name: transactions.name,
        amountCents: transactions.amountCents,
        accountId: transactions.accountId,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(and(eq(accounts.familyId, familyId), eq(transactions.kind, "standard"), lt(transactions.amountCents, 0), gte(transactions.date, fromDate)));
  }

  async getUncategorized(familyId: number): Promise<{ count: number; totalCents: number }> {
    const [row] = await db
      .select({ count: count(), totalCents: sql<number>`coalesce(sum(abs(${transactions.amountCents})), 0)`.mapWith(Number) })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(and(eq(accounts.familyId, familyId), eq(transactions.kind, "standard"), lt(transactions.amountCents, 0), isNull(transactions.categoryId)));
    return { count: row?.count ?? 0, totalCents: row?.totalCents ?? 0 };
  }
}
