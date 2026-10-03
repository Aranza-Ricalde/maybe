import { eq } from "drizzle-orm";
import type { GoalRecord, GoalsRepository, NewGoalInput, UpdateGoalInput } from "@/domain/goals/ports";
import { db } from "./client";
import { goalAccounts, goals } from "./schema/goals";

export class DrizzleGoalsRepository implements GoalsRepository {
  async getById(id: number): Promise<GoalRecord | null> {
    const [row] = await db.select({ id: goals.id, familyId: goals.familyId }).from(goals).where(eq(goals.id, id)).limit(1);
    return row ?? null;
  }

  async create(input: NewGoalInput): Promise<void> {
    const [goal] = await db
      .insert(goals)
      .values({ familyId: input.familyId, name: input.name, targetAmountCents: input.targetAmountCents, targetDate: input.targetDate, priority: 0 })
      .returning();

    if (input.accountIds.length > 0) {
      await db.insert(goalAccounts).values(input.accountIds.map((accountId) => ({ goalId: goal.id, accountId })));
    }
  }

  async update(input: UpdateGoalInput): Promise<void> {
    await db
      .update(goals)
      .set({ name: input.name, targetAmountCents: input.targetAmountCents, targetDate: input.targetDate, updatedAt: new Date() })
      .where(eq(goals.id, input.id));

    await db.delete(goalAccounts).where(eq(goalAccounts.goalId, input.id));
    if (input.accountIds.length > 0) {
      await db.insert(goalAccounts).values(input.accountIds.map((accountId) => ({ goalId: input.id, accountId })));
    }
  }

  async delete(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }
}
