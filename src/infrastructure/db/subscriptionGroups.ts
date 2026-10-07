import { and, eq, inArray } from "drizzle-orm";
import type { SubscriptionGroupsRepository } from "@/domain/spendingAnalysis/ports";
import type { SubscriptionAlias } from "@/domain/spendingAnalysis/subscriptions";
import { db } from "./client";
import { subscriptionAliases, subscriptionGroups } from "./schema/providers";

export class DrizzleSubscriptionGroupsRepository implements SubscriptionGroupsRepository {
  async listAliases(familyId: number): Promise<SubscriptionAlias[]> {
    return db
      .select({ aliasKey: subscriptionAliases.aliasKey, groupId: subscriptionGroups.id, groupName: subscriptionGroups.name })
      .from(subscriptionAliases)
      .innerJoin(subscriptionGroups, eq(subscriptionGroups.id, subscriptionAliases.groupId))
      .where(eq(subscriptionAliases.familyId, familyId));
  }

  async mergeAliases(familyId: number, groupName: string, aliasKeys: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ groupId: subscriptionAliases.groupId })
        .from(subscriptionAliases)
        .where(and(eq(subscriptionAliases.familyId, familyId), inArray(subscriptionAliases.aliasKey, aliasKeys)));
      const groupIds = [...new Set(existing.map((row) => row.groupId))].sort((a, b) => a - b);

      let targetId = groupIds[0];
      if (targetId == null) {
        const [created] = await tx.insert(subscriptionGroups).values({ familyId, name: groupName }).returning({ id: subscriptionGroups.id });
        targetId = created.id;
      } else {
        await tx.update(subscriptionGroups).set({ name: groupName }).where(and(eq(subscriptionGroups.id, targetId), eq(subscriptionGroups.familyId, familyId)));
        const others = groupIds.slice(1);
        if (others.length > 0) {
          await tx.update(subscriptionAliases).set({ groupId: targetId }).where(and(eq(subscriptionAliases.familyId, familyId), inArray(subscriptionAliases.groupId, others)));
          await tx.delete(subscriptionGroups).where(and(eq(subscriptionGroups.familyId, familyId), inArray(subscriptionGroups.id, others)));
        }
      }

      await tx
        .insert(subscriptionAliases)
        .values(aliasKeys.map((aliasKey) => ({ familyId, aliasKey, groupId: targetId })))
        .onConflictDoUpdate({ target: [subscriptionAliases.familyId, subscriptionAliases.aliasKey], set: { groupId: targetId } });
    });
  }

  async dissolveGroup(familyId: number, groupId: number): Promise<void> {
    await db.delete(subscriptionGroups).where(and(eq(subscriptionGroups.id, groupId), eq(subscriptionGroups.familyId, familyId)));
  }
}
