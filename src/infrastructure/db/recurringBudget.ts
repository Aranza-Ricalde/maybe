import { and, eq, isNull } from "drizzle-orm";
import type { RecurringBudgetRepository } from "@/domain/recurring/ports";
import { normalizeBudgetPolicy, type BudgetInclusion, type BudgetPolicy } from "@/domain/recurring/budgetInclusion";
import { db } from "./client";
import { recurringItems } from "./schema/budgeting";
import { families } from "./schema/core";

export class DrizzleRecurringBudgetRepository implements RecurringBudgetRepository {
  async getPolicy(familyId: number): Promise<BudgetPolicy> {
    const [row] = await db.select({ policy: families.recurringBudgetPolicy }).from(families).where(eq(families.id, familyId));
    return normalizeBudgetPolicy(row?.policy);
  }

  async setPolicy(familyId: number, policy: BudgetPolicy): Promise<void> {
    await db.update(families).set({ recurringBudgetPolicy: policy }).where(eq(families.id, familyId));
  }

  async getItem(id: number): Promise<{ id: number; familyId: number } | null> {
    const [row] = await db.select({ id: recurringItems.id, familyId: recurringItems.familyId }).from(recurringItems).where(eq(recurringItems.id, id));
    return row ?? null;
  }

  async setInclusion(id: number, inclusion: BudgetInclusion | null): Promise<void> {
    await db.update(recurringItems).set({ budgetInclusion: inclusion, updatedAt: new Date() }).where(eq(recurringItems.id, id));
  }

  async setInclusionForUndecided(familyId: number, inclusion: BudgetInclusion): Promise<number> {
    const rows = await db
      .update(recurringItems)
      .set({ budgetInclusion: inclusion, updatedAt: new Date() })
      .where(and(eq(recurringItems.familyId, familyId), isNull(recurringItems.budgetInclusion)))
      .returning({ id: recurringItems.id });
    return rows.length;
  }
}
