import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAtColumn, familyIdColumn, idColumn } from "./columns";

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: idColumn(),
    attemptKey: text("attempt_key").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("login_attempts_key_time_idx").on(table.attemptKey, table.attemptedAt)],
);


export const apiTokens = pgTable("api_tokens", {
  familyId: familyIdColumn().primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  lastFour: text("last_four").notNull(),
  createdAt: createdAtColumn(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});
