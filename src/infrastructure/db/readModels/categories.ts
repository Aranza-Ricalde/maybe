import { and, eq, gte, isNotNull, lte, notInArray, sql } from "drizzle-orm";
import { NON_FLOW_KINDS } from "@/domain/ledger/rules";
import type { CategoriesReader } from "@/domain/readModels/ports";
import { db } from "../client";
import { accounts } from "../schema/accounts";
import { categories } from "../schema/classification";
import { transactions } from "../schema/transactions";

export class DrizzleCategoriesReader implements CategoriesReader {
  async list(familyId: number) {
    return db.select().from(categories).where(eq(categories.familyId, familyId)).orderBy(categories.name);
  }

  async expenseTotalsBetween(familyId: number, fromDateInclusive: string, toDateInclusive: string) {
    const rows = await db
      .select({ categoryId: transactions.categoryId, totalCents: sql<number>`sum(${transactions.amountCents})`.mapWith(Number) })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .innerJoin(categories, eq(categories.id, transactions.categoryId))
      .where(
        and(
          eq(accounts.familyId, familyId),
          isNotNull(transactions.categoryId),
          eq(categories.classification, "expense"),
          notInArray(transactions.kind, [...NON_FLOW_KINDS]),
          gte(transactions.date, fromDateInclusive),
          lte(transactions.date, toDateInclusive),
        ),
      )
      .groupBy(transactions.categoryId);
    return rows.filter((row): row is { categoryId: number; totalCents: number } => row.categoryId !== null);
  }
}
