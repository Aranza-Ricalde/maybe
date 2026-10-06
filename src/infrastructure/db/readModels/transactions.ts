import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import type { TransactionFilters, TransactionSort } from "@/domain/ledger/filters";
import { TRANSFER_KINDS } from "@/domain/ledger/rules";
import type { TransactionsReader } from "@/domain/readModels/ports";
import { db } from "../client";
import { transactionsBetween } from "../periodTransactions";
import { accounts } from "../schema/accounts";
import { categories } from "../schema/classification";
import { transactionReviews } from "../schema/reviews";
import { transactions } from "../schema/transactions";

const SORT_COLUMNS = { date: transactions.date, amount: transactions.amountCents, name: transactions.name };

function filterConditions(familyId: number, filters: TransactionFilters) {
  const conditions = [eq(accounts.familyId, familyId)];
  if (filters.accountId != null) conditions.push(eq(transactions.accountId, filters.accountId));
  if (filters.categoryId != null) {
    const subcategoryIds = db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, filters.categoryId));
    const inBranch = or(eq(transactions.categoryId, filters.categoryId), inArray(transactions.categoryId, subcategoryIds));
    if (inBranch) conditions.push(inBranch);
  }
  if (filters.kindGroup === "standard") conditions.push(eq(transactions.kind, "standard"));
  if (filters.kindGroup === "transfers") conditions.push(inArray(transactions.kind, [...TRANSFER_KINDS]));
  if (filters.fromDate) conditions.push(gte(transactions.date, filters.fromDate));
  if (filters.toDate) conditions.push(lte(transactions.date, filters.toDate));
  if (filters.minAmountCents != null) conditions.push(gte(sql<number>`abs(${transactions.amountCents})`, filters.minAmountCents));
  if (filters.maxAmountCents != null) conditions.push(lte(sql<number>`abs(${transactions.amountCents})`, filters.maxAmountCents));
  if (filters.search) conditions.push(ilike(transactions.name, `%${filters.search}%`));
  return and(...conditions);
}

export class DrizzleTransactionsReader implements TransactionsReader {
  async recent(familyId: number, limit: number) {
    return db
      .select({
        id: transactions.id,
        date: transactions.date,
        amountCents: transactions.amountCents,
        name: transactions.name,
        kind: transactions.kind,
        accountName: accounts.name,
        categoryName: categories.name,
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(eq(accounts.familyId, familyId))
      .orderBy(desc(transactions.date), desc(transactions.id))
      .limit(limit);
  }

  async page(familyId: number, filters: TransactionFilters, sort: TransactionSort, page: number, pageSize: number) {
    const whereClause = filterConditions(familyId, filters);
    const orderFn = sort.direction === "asc" ? asc : desc;

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: transactions.id,
          date: transactions.date,
          amountCents: transactions.amountCents,
          name: transactions.name,
          accountId: transactions.accountId,
          accountName: accounts.name,
          categoryId: transactions.categoryId,
          categoryName: categories.name,
          kind: transactions.kind,
          reviewDecision: transactionReviews.decision,
        })
        .from(transactions)
        .innerJoin(accounts, eq(accounts.id, transactions.accountId))
        .leftJoin(categories, eq(categories.id, transactions.categoryId))
        .leftJoin(transactionReviews, and(eq(transactionReviews.transactionId, transactions.id), eq(transactionReviews.topic, "transfer_suspicion")))
        .where(whereClause)
        .orderBy(orderFn(SORT_COLUMNS[sort.field]), desc(transactions.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ n: count() }).from(transactions).innerJoin(accounts, eq(accounts.id, transactions.accountId)).where(whereClause),
    ]);

    return { rows, total: totalRow?.n ?? 0 };
  }

  async between(familyId: number, fromDateInclusive: string, toDateInclusive: string) {
    return transactionsBetween(familyId, fromDateInclusive, toDateInclusive);
  }
}
