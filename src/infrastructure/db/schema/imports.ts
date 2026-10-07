import { bigint, date, integer, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import type { ColumnMapping, ImportStatus } from "@/domain/csvImport/rules";
import { accounts } from "./accounts";
import { families } from "./core";
import { idColumn, familyIdColumn, createdAtColumn } from "./columns";

export const imports = pgTable("imports", {
  id: idColumn(),
  familyId: familyIdColumn(),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending").$type<ImportStatus>(),
  bank: text("bank"),
  accountId: bigint("account_id", { mode: "number" }).references(() => accounts.id, { onDelete: "set null" }),
  accountLast4: text("account_last4"),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  transactionCount: integer("transaction_count"),
  linkedCount: integer("linked_count"),
  metadata: jsonb("metadata").$type<Record<string, string | number>>(),
  createdAt: createdAtColumn(),
});

export const importMappings = pgTable(
  "import_mappings",
  {
    id: idColumn(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    bankSignature: text("bank_signature").notNull(),
    columnMapping: jsonb("column_mapping").notNull().$type<ColumnMapping>(),
  },
  (table) => [uniqueIndex("import_mappings_family_bank_unique").on(table.familyId, table.bankSignature)],
);
