import { bigint, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { NotificationKind } from "@/domain/notifications/rules";
import { createdAtColumn, familyIdColumn, idColumn } from "./columns";

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    type: text("type").notNull().$type<NotificationKind>(),
    dedupeKey: text("dedupe_key").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href").notNull().default("/"),
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    createdAt: createdAtColumn(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("notification_events_family_key_uidx").on(table.familyId, table.dedupeKey),
    index("notification_events_family_inbox_idx").on(table.familyId, table.createdAt),
  ],
);

export type NotificationEventRow = typeof notificationEvents.$inferSelect;

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: idColumn(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    familyId: familyIdColumn(),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: createdAtColumn(),
  },
  (table) => [index("push_subscriptions_family_idx").on(table.familyId), index("push_subscriptions_user_idx").on(table.userId)],
);
