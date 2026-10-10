import type { AuthenticatedUser } from "@/domain/auth/ports";
import type { LastNotification, NotificationKind, PlannedNotification } from "./rules";

export interface StoredNotification {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsRepository {
  insertIfNew(familyId: number, notification: PlannedNotification): Promise<number | null>;
  markSent(id: number): Promise<void>;
  lastOfKind(familyId: number, kind: NotificationKind): Promise<LastNotification | null>;
  resolveOpen(familyId: number, kind: NotificationKind): Promise<void>;
  listInbox(familyId: number, limit: number): Promise<StoredNotification[]>;
  countUnread(familyId: number): Promise<number>;
  markRead(familyId: number, id: number): Promise<void>;
  markAllRead(familyId: number): Promise<void>;
  dismiss(familyId: number, id: number): Promise<void>;
  dismissAll(familyId: number): Promise<void>;
  purgeOlderThan(isoDate: string): Promise<number>;
}

export interface DeliverableNotification extends Pick<PlannedNotification, "kind" | "title" | "body"> {
  href?: string;
  tag?: string;
}

export interface NotificationChannel {
  deliver(familyId: number, notification: DeliverableNotification): Promise<void>;
}

export interface FamilyDirectory {
  listFamilyUsers(): Promise<AuthenticatedUser[]>;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export type PushSendResult = "sent" | "gone";

export interface PushSender {
  send(subscription: PushSubscriptionRecord, payload: PushPayload): Promise<PushSendResult>;
}

export interface PushSubscriptionsRepository {
  save(userId: number, familyId: number, subscription: PushSubscriptionRecord, userAgent: string | null): Promise<void>;
  remove(endpoint: string): Promise<void>;
  listForFamily(familyId: number): Promise<PushSubscriptionRecord[]>;
  countForUser(userId: number): Promise<number>;
}
