import { bigint, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { families } from "./core";
import { idColumn } from "./columns";

export const NOTIFICATION_TYPES = [
  "budget_exceeded",
  "unusual_spend",
  "fixed_expense_due",
  "goal_completed",
  "goal_behind",
  "recurring_detected",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationEvents = pgTable("notification_events", {
  id: idColumn(),
  familyId: bigint("family_id", { mode: "number" })
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<NotificationType>(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});
