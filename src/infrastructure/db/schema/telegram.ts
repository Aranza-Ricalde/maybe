import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAtColumn, familyIdColumn, idColumn } from "./columns";

export const telegramDrafts = pgTable(
  "telegram_drafts",
  {
    id: idColumn(),
    chatId: text("chat_id").notNull(),
    familyId: familyIdColumn(),
    type: text("type").notNull().$type<"expense" | "income">(),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    description: text("description").notNull(),
    date: text("date"),
    notes: text("notes"),
    createdAt: createdAtColumn(),
  },
  (table) => [index("telegram_drafts_chat_idx").on(table.chatId)],
);

export const telegramProcessedUpdates = pgTable(
  "telegram_processed_updates",
  {
    updateId: bigint("update_id", { mode: "number" }).primaryKey(),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("telegram_processed_updates_at_idx").on(table.processedAt)],
);
