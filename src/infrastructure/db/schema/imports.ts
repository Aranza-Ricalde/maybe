import { bigint, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import type { ColumnMapping, ImportStatus } from "@/domain/csvImport/rules";
import { families } from "./core";
import { idColumn, familyIdColumn, createdAtColumn } from "./columns";

export const imports = pgTable("imports", {
  id: idColumn(),
  familyId: familyIdColumn(),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending").$type<ImportStatus>(),
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
