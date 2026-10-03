import { bigint, bigserial, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { FLOWS, type Flow } from "@/domain/ledger/rules";
import { checkEnum } from "./_helpers";
import { categories } from "./classification";
import { families } from "./core";
import { providers } from "./providers";

export const concepts = pgTable(
  "concepts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    providerId: bigint("provider_id", { mode: "number" }).references(() => providers.id, { onDelete: "set null" }),
    flow: text("flow").notNull().$type<Flow>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    checkEnum("concepts_flow_check", table.flow, FLOWS),
    uniqueIndex("concepts_family_name_unique").on(table.familyId, table.name),
  ],
);
