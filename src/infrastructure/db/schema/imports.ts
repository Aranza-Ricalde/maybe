import { bigint, customType, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export const statementInbox = pgTable(
  "statement_inbox",
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    bank: text("bank").notNull(),
    accountId: bigint("account_id", { mode: "number" })
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    contentHash: text("content_hash").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    data: bytea("data").notNull(),
    fromAddress: text("from_address"),
    subject: text("subject"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").notNull().default("pending"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    importId: bigint("import_id", { mode: "number" }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("statement_inbox_family_hash_uidx").on(table.familyId, table.contentHash),
    index("statement_inbox_family_status_idx").on(table.familyId, table.status),
  ],
);
