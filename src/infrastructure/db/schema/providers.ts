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

export const subscriptionGroups = pgTable("subscription_groups", {
  id: idColumn(),
  familyId: bigint("family_id", { mode: "number" })
    .notNull()
    .references(() => families.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  createdAt: createdAtColumn(),
});

export const subscriptionAliases = pgTable(
  "subscription_aliases",
  {
    id: idColumn(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    aliasKey: text("alias_key").notNull(),
    groupId: bigint("group_id", { mode: "number" })
      .notNull()
      .references(() => subscriptionGroups.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("subscription_aliases_family_key_unique").on(table.familyId, table.aliasKey)],
);
