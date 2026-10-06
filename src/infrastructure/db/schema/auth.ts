import { bigint, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./core";
import { idColumn, createdAtColumn } from "./columns";

export const sessions = pgTable("sessions", {
  id: idColumn(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAtColumn(),
});
