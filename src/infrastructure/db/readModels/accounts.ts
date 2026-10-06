import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import type { AccountsReader } from "@/domain/readModels/ports";
import { balancesAsOfByAccount } from "../balances";
import { db } from "../client";
import { accounts } from "../schema/accounts";
import { categories } from "../schema/classification";
import { transactions } from "../schema/transactions";

export class DrizzleAccountsReader implements AccountsReader {
  async listActive(familyId: number) {
    return db.select().from(accounts).where(and(eq(accounts.familyId, familyId), eq(accounts.isActive, true))).orderBy(accounts.id);
  }

  async listArchived(familyId: number) {
    return db.select().from(accounts).where(and(eq(accounts.familyId, familyId), eq(accounts.isActive, false))).orderBy(desc(accounts.updatedAt));
  }

  async balancesAsOf(accountIds: number[], asOfDate: string) {
    return balancesAsOfByAccount(accountIds, asOfDate);
  }

  async movementsPage(accountId: number, fromDateInclusive: string, toDateInclusive: string, page: number, pageSize: number) {
    const whereClause = and(eq(transactions.accountId, accountId), gte(transactions.date, fromDateInclusive), lte(transactions.date, toDateInclusive));

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: transactions.id,
          date: transactions.date,
          amountCents: transactions.amountCents,
          name: transactions.name,
          kind: transactions.kind,
          categoryName: categories.name,
        })
        .from(transactions)
        .leftJoin(categories, eq(categories.id, transactions.categoryId))
        .where(whereClause)
        .orderBy(desc(transactions.date), desc(transactions.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ n: count() }).from(transactions).where(whereClause),
    ]);

    return { rows, total: totalRow?.n ?? 0 };
  }
}
