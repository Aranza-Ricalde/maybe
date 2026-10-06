import { and, eq, gte, isNull, lt, lte, notInArray, or, sql } from "drizzle-orm";
import type { CategoryStatsRepository } from "@/domain/categoryStats/ports";
import type { MonthlyCategorySpend, StatCategory } from "@/domain/categoryStats/rules";
import { NON_FLOW_KINDS } from "@/domain/ledger/rules";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { categories } from "./schema/classification";
import { transactions } from "./schema/transactions";

export class DrizzleCategoryStatsRepository implements CategoryStatsRepository {
  async listCategories(familyId: number): Promise<StatCategory[]> {
    return db
      .select({ id: categories.id, name: categories.name, parentId: categories.parentId, nature: categories.spendingNature })
      .from(categories)
      .where(eq(categories.familyId, familyId));
  }

  async getMonthlySpend(familyId: number, fromDate: string, toDate: string): Promise<MonthlyCategorySpend[]> {
    const month = sql<string>`to_char(${transactions.date}, 'YYYY-MM') || '-01'`;
    const rows = await db
      .select({
        categoryId: transactions.categoryId,
        month,
        spentCents: sql<number>`-sum(${transactions.amountCents})`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(
        and(
          eq(accounts.familyId, familyId),
          gte(transactions.date, fromDate),
          lte(transactions.date, toDate),
          notInArray(transactions.kind, [...NON_FLOW_KINDS]),
          or(eq(categories.classification, "expense"), and(isNull(transactions.categoryId), lt(transactions.amountCents, 0))),
        ),
      )
      .groupBy(transactions.categoryId, month);
    return rows;
  }
}
