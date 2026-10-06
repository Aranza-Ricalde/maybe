import { eq } from "drizzle-orm";
import type { NewRecurringItemInput, RecurringItemRecord, RecurringItemsRepository, RecurringItemStatus, UpdateRecurringItemInput } from "@/domain/recurring/ports";
import { db } from "./client";
import { recurringItems } from "./schema/budgeting";

export class DrizzleRecurringItemsRepository implements RecurringItemsRepository {
  async getById(id: number): Promise<RecurringItemRecord | null> {
    const [row] = await db
      .select({ id: recurringItems.id, familyId: recurringItems.familyId, conceptId: recurringItems.conceptId })
      .from(recurringItems)
      .where(eq(recurringItems.id, id));
    return row ?? null;
  }

  async create(input: NewRecurringItemInput): Promise<RecurringItemRecord> {
    const [row] = await db
      .insert(recurringItems)
      .values({
        familyId: input.familyId,
        name: input.name,
        flow: input.flow,
        estimatedAmountCents: input.estimatedAmountCents,
        categoryId: input.categoryId,
        conceptId: input.conceptId,
        dayOfMonth: input.dayOfMonth,
        accountId: input.accountId,
        autoDetected: input.autoDetected,
        budgetInclusion: input.budgetInclusion ?? null,
        status: "active",
      })
      .returning({ id: recurringItems.id, familyId: recurringItems.familyId, conceptId: recurringItems.conceptId });
    return row;
  }

  async update(input: UpdateRecurringItemInput): Promise<void> {
    await db
      .update(recurringItems)
      .set({
        name: input.name,
        flow: input.flow,
        estimatedAmountCents: input.estimatedAmountCents,
        categoryId: input.categoryId,
        conceptId: input.conceptId,
        dayOfMonth: input.dayOfMonth,
        accountId: input.accountId,
        updatedAt: new Date(),
      })
      .where(eq(recurringItems.id, input.id));
  }

  async delete(id: number): Promise<void> {
    await db.delete(recurringItems).where(eq(recurringItems.id, id));
  }

  async setStatus(id: number, status: RecurringItemStatus): Promise<void> {
    await db.update(recurringItems).set({ status }).where(eq(recurringItems.id, id));
  }
}
