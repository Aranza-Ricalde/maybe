import { eq } from "drizzle-orm";
import type { EmergencyFundGoal, EmergencyFundGoalRepository } from "@/domain/wealth/ports";
import { isEmergencyFundGoalName } from "@/domain/wealth/rules";
import { db } from "./client";
import { goalAccounts, goals } from "./schema/goals";

export class DrizzleEmergencyFundGoalRepository implements EmergencyFundGoalRepository {
  async findEmergencyFundGoal(familyId: number): Promise<EmergencyFundGoal | null> {
    const list = await db.select({ id: goals.id, name: goals.name, targetAmountCents: goals.targetAmountCents }).from(goals).where(eq(goals.familyId, familyId)).orderBy(goals.id);
    const goal = list.find((g) => isEmergencyFundGoalName(g.name));
    if (!goal) return null;
    const links = await db.select({ accountId: goalAccounts.accountId }).from(goalAccounts).where(eq(goalAccounts.goalId, goal.id));
    return { targetAmountCents: goal.targetAmountCents, accountIds: links.map((l) => l.accountId) };
  }
}
