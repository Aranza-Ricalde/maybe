import { bigint, bigserial, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const families = pgTable("families", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  familyId: bigint("family_id", { mode: "number" })
    .notNull()
    .references(() => families.id, { onDelete: "restrict" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  telegramChatId: text("telegram_chat_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
