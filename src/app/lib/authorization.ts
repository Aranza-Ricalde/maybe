import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { accounts } from "@/infrastructure/db/schema/accounts";
import { recurringCandidates, recurringItems } from "@/infrastructure/db/schema/budgeting";
import { categories } from "@/infrastructure/db/schema/classification";
import { concepts } from "@/infrastructure/db/schema/concepts";
import { goals } from "@/infrastructure/db/schema/goals";
import { conceptMatchSuggestions } from "@/infrastructure/db/schema/matching";
import { payPeriods } from "@/infrastructure/db/schema/payPeriods";
import { providers } from "@/infrastructure/db/schema/providers";
import { transactions } from "@/infrastructure/db/schema/transactions";

export async function isAccountOwnedByFamily(accountId: number, familyId: number): Promise<boolean> {
  const [account] = await db.select({ familyId: accounts.familyId }).from(accounts).where(eq(accounts.id, accountId));
  return Boolean(account && account.familyId === familyId);
}

export async function isGoalOwnedByFamily(goalId: number, familyId: number): Promise<boolean> {
  const [goal] = await db.select({ familyId: goals.familyId }).from(goals).where(eq(goals.id, goalId));
  return Boolean(goal && goal.familyId === familyId);
}

export async function isPayPeriodOwnedByFamily(periodId: number, familyId: number): Promise<boolean> {
  const [period] = await db.select({ familyId: payPeriods.familyId }).from(payPeriods).where(eq(payPeriods.id, periodId));
  return Boolean(period && period.familyId === familyId);
}

export async function isCategoryOwnedByFamily(categoryId: number, familyId: number): Promise<boolean> {
  const [category] = await db.select({ familyId: categories.familyId }).from(categories).where(eq(categories.id, categoryId));
  return Boolean(category && category.familyId === familyId);
}

export async function isRecurringItemOwnedByFamily(recurringItemId: number, familyId: number): Promise<boolean> {
  const [item] = await db.select({ familyId: recurringItems.familyId }).from(recurringItems).where(eq(recurringItems.id, recurringItemId));
  return Boolean(item && item.familyId === familyId);
}

export async function isRecurringCandidateOwnedByFamily(candidateId: number, familyId: number): Promise<boolean> {
  const [candidate] = await db.select({ familyId: recurringCandidates.familyId }).from(recurringCandidates).where(eq(recurringCandidates.id, candidateId));
  return Boolean(candidate && candidate.familyId === familyId);
}

export async function isTransactionOwnedByFamily(transactionId: number, familyId: number): Promise<boolean> {
  const [owner] = await db
    .select({ familyId: accounts.familyId })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(eq(transactions.id, transactionId));
  return Boolean(owner && owner.familyId === familyId);
}

export async function isConceptSuggestionOwnedByFamily(suggestionId: number, familyId: number): Promise<boolean> {
  const [suggestion] = await db
    .select({ familyId: conceptMatchSuggestions.familyId })
    .from(conceptMatchSuggestions)
    .where(eq(conceptMatchSuggestions.id, suggestionId));
  return Boolean(suggestion && suggestion.familyId === familyId);
}

export async function isProviderOwnedByFamily(providerId: number, familyId: number): Promise<boolean> {
  const [provider] = await db.select({ familyId: providers.familyId }).from(providers).where(eq(providers.id, providerId));
  return Boolean(provider && provider.familyId === familyId);
}

export async function isConceptOwnedByFamily(conceptId: number, familyId: number): Promise<boolean> {
  const [concept] = await db.select({ familyId: concepts.familyId }).from(concepts).where(eq(concepts.id, conceptId));
  return Boolean(concept && concept.familyId === familyId);
}
