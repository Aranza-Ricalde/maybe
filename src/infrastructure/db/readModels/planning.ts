import { eq, getTableColumns } from "drizzle-orm";
import type { PlanningReader } from "@/domain/readModels/ports";
import { normalizeBudgetPolicy } from "@/domain/recurring/budgetInclusion";
import { db } from "../client";
import { budgetCategorySettings, recurringItems, scheduledTransactions } from "../schema/budgeting";
import { concepts } from "../schema/concepts";
import { families } from "../schema/core";
import { goalAccounts, goals } from "../schema/goals";

export class DrizzlePlanningReader implements PlanningReader {
  async goals(familyId: number) {
    return db.select().from(goals).where(eq(goals.familyId, familyId)).orderBy(goals.priority);
  }

  async goalAccountLinks(familyId: number) {
    return db
      .select({ goalId: goalAccounts.goalId, accountId: goalAccounts.accountId })
      .from(goalAccounts)
      .innerJoin(goals, eq(goals.id, goalAccounts.goalId))
      .where(eq(goals.familyId, familyId));
  }

  async scheduled(familyId: number) {
    return db.select().from(scheduledTransactions).where(eq(scheduledTransactions.familyId, familyId)).orderBy(scheduledTransactions.scheduledDate);
  }

  async recurringItems(familyId: number) {
    return db
      .select({ ...getTableColumns(recurringItems), providerId: concepts.providerId })
      .from(recurringItems)
      .leftJoin(concepts, eq(concepts.id, recurringItems.conceptId))
      .where(eq(recurringItems.familyId, familyId))
      .orderBy(recurringItems.dayOfMonth);
  }

  async budgetSettings(familyId: number) {
    return db
      .select({ categoryId: budgetCategorySettings.categoryId, cadence: budgetCategorySettings.cadence, budgetedAmountCents: budgetCategorySettings.budgetedAmountCents })
      .from(budgetCategorySettings)
      .where(eq(budgetCategorySettings.familyId, familyId));
  }

  async budgetPolicy(familyId: number) {
    const [row] = await db.select({ policy: families.recurringBudgetPolicy }).from(families).where(eq(families.id, familyId));
    return normalizeBudgetPolicy(row?.policy);
  }
}
