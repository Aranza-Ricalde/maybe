import { bigint, bigserial, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { families } from "./core";

export const providers = pgTable(
  "providers",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("providers_family_name_unique").on(table.familyId, table.name)],
);
