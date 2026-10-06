import { bigint, bigserial, timestamp } from "drizzle-orm/pg-core";
import { families } from "./core";

export const idColumn = () => bigserial("id", { mode: "number" }).primaryKey();

export const familyIdColumn = () =>
  bigint("family_id", { mode: "number" })
    .notNull()
    .references(() => families.id, { onDelete: "restrict" });

export const createdAtColumn = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
export const updatedAtColumn = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
