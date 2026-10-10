import { and, count, desc, eq, isNull, lt } from "drizzle-orm";
import type { NotificationsRepository, StoredNotification } from "@/domain/notifications/ports";
import type { LastNotification, NotificationKind, PlannedNotification } from "@/domain/notifications/rules";
import { db } from "./client";
import { notificationEvents } from "./schema/notifications";

const visible = (familyId: number) => and(eq(notificationEvents.familyId, familyId), isNull(notificationEvents.readAt), isNull(notificationEvents.dismissedAt));

export class DrizzleNotificationsRepository implements NotificationsRepository {
  async insertIfNew(familyId: number, notification: PlannedNotification): Promise<number | null> {
    const [row] = await db
      .insert(notificationEvents)
      .values({ familyId, type: notification.kind, dedupeKey: notification.dedupeKey, title: notification.title, body: notification.body, href: notification.href, payload: notification.payload })
      .onConflictDoNothing()
      .returning({ id: notificationEvents.id });
    return row?.id ?? null;
  }

  async markSent(id: number): Promise<void> {
    await db.update(notificationEvents).set({ sentAt: new Date() }).where(eq(notificationEvents.id, id));
  }

  async lastOfKind(familyId: number, kind: NotificationKind): Promise<LastNotification | null> {
    const [row] = await db
      .select({ createdAt: notificationEvents.createdAt, resolvedAt: notificationEvents.resolvedAt, payload: notificationEvents.payload })
      .from(notificationEvents)
      .where(and(eq(notificationEvents.familyId, familyId), eq(notificationEvents.type, kind)))
      .orderBy(desc(notificationEvents.createdAt))
      .limit(1);
    return row ? { createdAt: row.createdAt.toISOString(), resolved: row.resolvedAt != null, payload: row.payload } : null;
  }

  async resolveOpen(familyId: number, kind: NotificationKind): Promise<void> {
    await db
      .update(notificationEvents)
      .set({ resolvedAt: new Date() })
      .where(and(eq(notificationEvents.familyId, familyId), eq(notificationEvents.type, kind), isNull(notificationEvents.resolvedAt)));
  }

  async listInbox(familyId: number, limit: number): Promise<StoredNotification[]> {
    const rows = await db.select().from(notificationEvents).where(visible(familyId)).orderBy(desc(notificationEvents.createdAt)).limit(limit);
    return rows.map((row) => ({ id: row.id, kind: row.type, title: row.title, body: row.body, href: row.href, createdAt: row.createdAt.toISOString(), readAt: null }));
  }

  async countUnread(familyId: number): Promise<number> {
    const [row] = await db.select({ total: count() }).from(notificationEvents).where(visible(familyId));
    return row?.total ?? 0;
  }

  async markRead(familyId: number, id: number): Promise<void> {
    await db.update(notificationEvents).set({ readAt: new Date() }).where(and(eq(notificationEvents.familyId, familyId), eq(notificationEvents.id, id)));
  }

  async markAllRead(familyId: number): Promise<void> {
    await db.update(notificationEvents).set({ readAt: new Date() }).where(visible(familyId));
  }

  async dismiss(familyId: number, id: number): Promise<void> {
    await db.update(notificationEvents).set({ dismissedAt: new Date() }).where(and(eq(notificationEvents.familyId, familyId), eq(notificationEvents.id, id)));
  }

  async dismissAll(familyId: number): Promise<void> {
    await db.update(notificationEvents).set({ dismissedAt: new Date() }).where(visible(familyId));
  }

  async purgeOlderThan(isoDate: string): Promise<number> {
    const removed = await db.delete(notificationEvents).where(lt(notificationEvents.createdAt, new Date(`${isoDate}T00:00:00Z`))).returning({ id: notificationEvents.id });
    return removed.length;
  }
}
