import { bigint, bigserial, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { ColumnMapping } from "@/domain/csvImport/rules";
import { checkEnum } from "./_helpers";
import { families } from "./core";

export const IMPORT_STATUSES = ["pending", "completed", "failed"] as const;

export const imports = pgTable(
  "imports",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    filename: text("filename").notNull(),
    status: text("status").notNull().default("pending").$type<(typeof IMPORT_STATUSES)[number]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [checkEnum("imports_status_check", table.status, IMPORT_STATUSES)],
);

export const importMappings = pgTable(
  "import_mappings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    bankSignature: text("bank_signature").notNull(),
    columnMapping: jsonb("column_mapping").notNull().$type<ColumnMapping>(),
  },
  (table) => [uniqueIndex("import_mappings_family_bank_unique").on(table.familyId, table.bankSignature)],
);
