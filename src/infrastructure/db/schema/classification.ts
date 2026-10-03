import { bigint, bigserial, pgTable, text, timestamp, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { FLOWS, type Flow } from "@/domain/ledger/rules";
import { checkEnum } from "./_helpers";
import { families } from "./core";
import { providers } from "./providers";

export const categories = pgTable(
  "categories",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    parentId: bigint("parent_id", { mode: "number" }).references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    icon: text("icon").notNull(),
    classification: text("classification").notNull().$type<Flow>(),
  },
  (table) => [checkEnum("categories_classification_check", table.classification, FLOWS)],
);

export const tags = pgTable("tags", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  familyId: bigint("family_id", { mode: "number" })
    .notNull()
    .references(() => families.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const merchantPatterns = pgTable(
  "merchant_patterns",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    rawPattern: text("raw_pattern").notNull(),
    cleanName: text("clean_name").notNull(),
    providerId: bigint("provider_id", { mode: "number" }).references(() => providers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("merchant_patterns_family_pattern_unique").on(table.familyId, table.rawPattern)],
);
