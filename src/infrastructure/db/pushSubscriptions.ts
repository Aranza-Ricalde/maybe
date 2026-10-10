import { count, eq } from "drizzle-orm";
import type { PushSubscriptionRecord, PushSubscriptionsRepository } from "@/domain/notifications/ports";
import { db } from "./client";
import { pushSubscriptions } from "./schema/notifications";

export class DrizzlePushSubscriptionsRepository implements PushSubscriptionsRepository {
  async save(userId: number, familyId: number, subscription: PushSubscriptionRecord, userAgent: string | null): Promise<void> {
    await db
      .insert(pushSubscriptions)
      .values({ userId, familyId, endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth, userAgent })
      .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId, familyId, p256dh: subscription.p256dh, auth: subscription.auth, userAgent } });
  }

  async remove(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async listForFamily(familyId: number): Promise<PushSubscriptionRecord[]> {
    return db
      .select({ endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.familyId, familyId));
  }

  async countForUser(userId: number): Promise<number> {
    const [row] = await db.select({ total: count() }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    return row?.total ?? 0;
  }
}
