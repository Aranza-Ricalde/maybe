import { bigint, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import type { Flow } from "@/domain/ledger/rules";
import { categories } from "./classification";
import { families } from "./core";
import { providers } from "./providers";
import { idColumn, createdAtColumn, updatedAtColumn } from "./columns";

export const concepts = pgTable(
  "concepts",
  {
    id: idColumn(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    providerId: bigint("provider_id", { mode: "number" }).references(() => providers.id, { onDelete: "set null" }),
    flow: text("flow").notNull().$type<Flow>(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [uniqueIndex("concepts_family_name_unique").on(table.familyId, table.name)],
);
