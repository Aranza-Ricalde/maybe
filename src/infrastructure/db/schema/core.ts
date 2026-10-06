import { pgTable, text } from "drizzle-orm/pg-core";
import { idColumn, familyIdColumn, createdAtColumn } from "./columns";

export const families = pgTable("families", {
  id: idColumn(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  recurringBudgetPolicy: text("recurring_budget_policy"),
  createdAt: createdAtColumn(),
});

export const users = pgTable("users", {
  id: idColumn(),
  familyId: familyIdColumn(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  telegramChatId: text("telegram_chat_id"),
  createdAt: createdAtColumn(),
});
