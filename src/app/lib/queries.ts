import "server-only";
import { and, asc, count, desc, eq, gte, ilike, isNotNull, lte, notInArray, sql } from "drizzle-orm";
import { TRANSFER_KINDS } from "@/domain/ledger/rules";
import { db } from "@/infrastructure/db/client";
import { balancesAsOfByAccount } from "@/infrastructure/db/balances";
import { accounts } from "@/infrastructure/db/schema/accounts";
import { categories } from "@/infrastructure/db/schema/classification";
import { budgetCategorySettings, recurringCandidates, recurringItems, scheduledTransactions } from "@/infrastructure/db/schema/budgeting";
import { concepts } from "@/infrastructure/db/schema/concepts";
import { goalAccounts, goals } from "@/infrastructure/db/schema/goals";
import { conceptMatchSuggestions } from "@/infrastructure/db/schema/matching";
import { providers } from "@/infrastructure/db/schema/providers";
import { transactions } from "@/infrastructure/db/schema/transactions";

export function getFamilyAccounts(familyId: number) {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.familyId, familyId), eq(accounts.isActive, true)))
    .orderBy(accounts.id);
}

export function getArchivedAccounts(familyId: number) {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.familyId, familyId), eq(accounts.isActive, false)))
    .orderBy(desc(accounts.updatedAt));
}

export async function getAccountTransactionsPage(
  accountId: number,
  fromDateInclusive: string,
  toDateInclusive: string,
  page: number,
  pageSize: number,
) {
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

export async function getFamilyLiabilityAccountsWithBalances(familyId: number, asOfDate: string) {
  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.familyId, familyId), eq(accounts.classification, "liability"), eq(accounts.isActive, true)));
  const balances = await balancesAsOfByAccount(
    rows.map((r) => r.id),
    asOfDate,
  );
  return rows.map((r) => ({ id: r.id, name: r.name, type: r.type, balanceCents: balances.get(r.id) ?? 0 }));
}

export function getFamilyCategories(familyId: number) {
  return db.select().from(categories).where(eq(categories.familyId, familyId)).orderBy(categories.name);
}

export function getFamilyConcepts(familyId: number) {
  return db.select().from(concepts).where(eq(concepts.familyId, familyId)).orderBy(concepts.name);
}

export function getFamilyProviders(familyId: number) {
  return db.select().from(providers).where(eq(providers.familyId, familyId)).orderBy(providers.name);
}

export async function getRecentTransactions(familyId: number, limit: number) {
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

export interface TransactionFilters {
  accountId?: number;
  categoryId?: number;
  fromDate?: string;
  toDate?: string;
  minAmountCents?: number;
  maxAmountCents?: number;
  search?: string;
}

export interface TransactionSort {
  field: "date" | "amount" | "name";
  direction: "asc" | "desc";
}

const TRANSACTION_SORT_COLUMNS = { date: transactions.date, amount: transactions.amountCents, name: transactions.name };

export async function getFamilyTransactionsPage(familyId: number, filters: TransactionFilters, sort: TransactionSort, page: number, pageSize: number) {
  const conditions = [eq(accounts.familyId, familyId)];
  if (filters.accountId != null) conditions.push(eq(transactions.accountId, filters.accountId));
  if (filters.categoryId != null) conditions.push(eq(transactions.categoryId, filters.categoryId));
  if (filters.fromDate) conditions.push(gte(transactions.date, filters.fromDate));
  if (filters.toDate) conditions.push(lte(transactions.date, filters.toDate));
  if (filters.minAmountCents != null) conditions.push(gte(sql<number>`abs(${transactions.amountCents})`, filters.minAmountCents));
  if (filters.maxAmountCents != null) conditions.push(lte(sql<number>`abs(${transactions.amountCents})`, filters.maxAmountCents));
  if (filters.search) conditions.push(ilike(transactions.name, `%${filters.search}%`));
  const whereClause = and(...conditions);

  const orderFn = sort.direction === "asc" ? asc : desc;
  const sortColumn = TRANSACTION_SORT_COLUMNS[sort.field];

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
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(whereClause)
      .orderBy(orderFn(sortColumn), desc(transactions.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ n: count() })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(whereClause),
  ]);

  return { rows, total: totalRow?.n ?? 0 };
}

export function getPendingRecurringCandidates(familyId: number) {
  return db
    .select()
    .from(recurringCandidates)
    .where(and(eq(recurringCandidates.familyId, familyId), eq(recurringCandidates.status, "pending")))
    .orderBy(desc(recurringCandidates.detectedAt));
}

export function getFamilyRecurringItems(familyId: number) {
  return db.select().from(recurringItems).where(eq(recurringItems.familyId, familyId)).orderBy(recurringItems.dayOfMonth);
}

export function getFamilyGoals(familyId: number) {
  return db.select().from(goals).where(eq(goals.familyId, familyId)).orderBy(goals.priority);
}

export function getPendingConceptSuggestions(familyId: number) {
  return db
    .select({
      id: conceptMatchSuggestions.id,
      score: conceptMatchSuggestions.score,
      transactionId: transactions.id,
      transactionName: transactions.name,
      transactionDate: transactions.date,
      transactionAmountCents: transactions.amountCents,
      conceptId: concepts.id,
      conceptName: concepts.name,
    })
    .from(conceptMatchSuggestions)
    .innerJoin(transactions, eq(transactions.id, conceptMatchSuggestions.transactionId))
    .innerJoin(concepts, eq(concepts.id, conceptMatchSuggestions.suggestedConceptId))
    .where(and(eq(conceptMatchSuggestions.familyId, familyId), eq(conceptMatchSuggestions.status, "pending")))
    .orderBy(desc(conceptMatchSuggestions.createdAt));
}

export async function getGoalAccountLinks(familyId: number) {
  return db
    .select({ goalId: goalAccounts.goalId, accountId: goalAccounts.accountId })
    .from(goalAccounts)
    .innerJoin(goals, eq(goals.id, goalAccounts.goalId))
    .where(eq(goals.familyId, familyId));
}

export function getAccountBalancesAsOf(accountIds: number[], asOfDate: string) {
  return balancesAsOfByAccount(accountIds, asOfDate);
}

export function getFamilyScheduled(familyId: number) {
  return db.select().from(scheduledTransactions).where(eq(scheduledTransactions.familyId, familyId)).orderBy(scheduledTransactions.scheduledDate);
}

export function getPeriodTransactionsForCalendar(familyId: number, fromDateInclusive: string, toDateInclusive: string) {
  return db
    .select({
      name: transactions.name,
      date: transactions.date,
      amountCents: transactions.amountCents,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      conceptId: transactions.conceptId,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(and(eq(accounts.familyId, familyId), gte(transactions.date, fromDateInclusive), lte(transactions.date, toDateInclusive)));
}

export async function getBudgetCategorySettings(familyId: number) {
  return db
    .select({
      categoryId: budgetCategorySettings.categoryId,
      cadence: budgetCategorySettings.cadence,
      budgetedAmountCents: budgetCategorySettings.budgetedAmountCents,
    })
    .from(budgetCategorySettings)
    .where(eq(budgetCategorySettings.familyId, familyId));
}

export async function getCategoryTotalsForDateRange(familyId: number, fromDateInclusive: string, toDateInclusive: string) {
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
        notInArray(transactions.kind, [...TRANSFER_KINDS]),
        gte(transactions.date, fromDateInclusive),
        lte(transactions.date, toDateInclusive),
      ),
    )
    .groupBy(transactions.categoryId);
  return rows.filter((r): r is { categoryId: number; totalCents: number } => r.categoryId !== null);
}
