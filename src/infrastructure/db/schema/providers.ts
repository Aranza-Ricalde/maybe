import { bigint, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { families } from "./core";
import { idColumn, createdAtColumn } from "./columns";

export const providers = pgTable(
  "providers",
  {
    id: idColumn(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [uniqueIndex("providers_family_name_unique").on(table.familyId, table.name)],
);
