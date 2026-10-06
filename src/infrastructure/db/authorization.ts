import type { FamilyOwnership, OwnedResource } from "@/domain/auth/ownership";
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { recurringCandidates, recurringItems } from "./schema/budgeting";
import { categories } from "./schema/classification";
import { goals } from "./schema/goals";
import { conceptMatchSuggestions } from "./schema/matching";
import { payPeriods } from "./schema/payPeriods";
import { transactions } from "./schema/transactions";

interface FamilyOwnedTable extends PgTable {
  id: AnyPgColumn;
  familyId: AnyPgColumn;
}

async function existsWhere(table: PgTable, condition: SQL | undefined): Promise<boolean> {
  const rows = await db.select({ one: sql<number>`1` }).from(table).where(condition).limit(1);
  return rows.length > 0;
}

function ownedByFamily(table: FamilyOwnedTable) {
  return (id: number, familyId: number) => existsWhere(table, and(eq(table.id, id), eq(table.familyId, familyId)));
}

export const isAccountOwnedByFamily = ownedByFamily(accounts);
export const isGoalOwnedByFamily = ownedByFamily(goals);
export const isPayPeriodOwnedByFamily = ownedByFamily(payPeriods);
export const isCategoryOwnedByFamily = ownedByFamily(categories);
export const isRecurringItemOwnedByFamily = ownedByFamily(recurringItems);
export const isRecurringCandidateOwnedByFamily = ownedByFamily(recurringCandidates);
export const isConceptSuggestionOwnedByFamily = ownedByFamily(conceptMatchSuggestions);

export async function areAccountsOwnedByFamily(accountIds: number[], familyId: number): Promise<boolean> {
  const unique = [...new Set(accountIds)];
  if (unique.length === 0) return true;
  const owned = await db.select({ id: accounts.id }).from(accounts).where(and(inArray(accounts.id, unique), eq(accounts.familyId, familyId)));
  return owned.length === unique.length;
}

export async function isTransactionOwnedByFamily(transactionId: number, familyId: number): Promise<boolean> {
  const rows = await db
    .select({ id: transactions.id })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(and(eq(transactions.id, transactionId), eq(accounts.familyId, familyId)))
    .limit(1);
  return rows.length > 0;
}

const OWNERSHIP_CHECKS: Record<OwnedResource, (id: number, familyId: number) => Promise<boolean>> = {
  account: isAccountOwnedByFamily,
  category: isCategoryOwnedByFamily,
  goal: isGoalOwnedByFamily,
  payPeriod: isPayPeriodOwnedByFamily,
  recurringItem: isRecurringItemOwnedByFamily,
  recurringCandidate: isRecurringCandidateOwnedByFamily,
  transaction: isTransactionOwnedByFamily,
  conceptSuggestion: isConceptSuggestionOwnedByFamily,
};

export const drizzleFamilyOwnership: FamilyOwnership = {
  owns: (resource, id, familyId) => OWNERSHIP_CHECKS[resource](id, familyId),
  ownsAllAccounts: areAccountsOwnedByFamily,
};
