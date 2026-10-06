import { bigint, index, pgTable, text, type AnyPgColumn, uniqueIndex } from "drizzle-orm/pg-core";
import type { SpendingNature } from "@/domain/categories/nature";
import type { Flow } from "@/domain/ledger/rules";
import { families } from "./core";
import { providers } from "./providers";
import { idColumn, familyIdColumn, createdAtColumn } from "./columns";

export const categories = pgTable("categories", {
  id: idColumn(),
  familyId: familyIdColumn(),
  parentId: bigint("parent_id", { mode: "number" }).references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  classification: text("classification").notNull().$type<Flow>(),
  spendingNature: text("spending_nature").$type<SpendingNature>(),
}, (table) => [index("categories_family_idx").on(table.familyId)]);

export const tags = pgTable("tags", {
  id: idColumn(),
  familyId: familyIdColumn(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const merchantPatterns = pgTable(
  "merchant_patterns",
  {
    id: idColumn(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    rawPattern: text("raw_pattern").notNull(),
    cleanName: text("clean_name").notNull(),
    providerId: bigint("provider_id", { mode: "number" }).references(() => providers.id, { onDelete: "set null" }),
    createdAt: createdAtColumn(),
  },
  (table) => [uniqueIndex("merchant_patterns_family_pattern_unique").on(table.familyId, table.rawPattern)],
);
