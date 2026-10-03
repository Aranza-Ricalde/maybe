import { and, eq } from "drizzle-orm";
import type { BudgetCategorySettingRecord, BudgetsRepository } from "@/domain/budget/ports";
import type { BudgetCadence } from "@/domain/budget/rules";
import { db } from "./client";
import { budgetCategorySettings } from "./schema/budgeting";

export class DrizzleBudgetsRepository implements BudgetsRepository {
  async listForFamily(familyId: number): Promise<BudgetCategorySettingRecord[]> {
    return db.select().from(budgetCategorySettings).where(eq(budgetCategorySettings.familyId, familyId));
  }

  async setLine(familyId: number, categoryId: number, cadence: BudgetCadence, budgetedAmountCents: number): Promise<void> {
    await db
      .insert(budgetCategorySettings)
      .values({ familyId, categoryId, cadence, budgetedAmountCents })
      .onConflictDoUpdate({
        target: [budgetCategorySettings.familyId, budgetCategorySettings.categoryId],
        set: { cadence, budgetedAmountCents, updatedAt: new Date() },
      });
  }

  async deleteLine(familyId: number, categoryId: number): Promise<void> {
    await db.delete(budgetCategorySettings).where(and(eq(budgetCategorySettings.familyId, familyId), eq(budgetCategorySettings.categoryId, categoryId)));
  }
}
