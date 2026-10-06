import { bigint, date, index, pgTable, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";
import type { TransactionKind, TransactionSource, TransactionStatus, ValuationSource } from "@/domain/ledger/rules";
import { accounts } from "./accounts";
import { categories, merchantPatterns, tags } from "./classification";
import { concepts } from "./concepts";
import { imports } from "./imports";
import { idColumn, createdAtColumn, updatedAtColumn } from "./columns";

export const transactions = pgTable(
  "transactions",
  {
    id: idColumn(),
    accountId: bigint("account_id", { mode: "number" })
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    date: date("date").notNull(),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    rawDescription: text("raw_description"),
    merchantId: bigint("merchant_id", { mode: "number" }).references(() => merchantPatterns.id, {
      onDelete: "set null",
    }),
    categoryId: bigint("category_id", { mode: "number" }).references(() => categories.id, { onDelete: "set null" }),
    conceptId: bigint("concept_id", { mode: "number" }).references(() => concepts.id, { onDelete: "set null" }),
    notes: text("notes"),
    kind: text("kind").notNull().default("standard").$type<TransactionKind>(),
    status: text("status").notNull().default("posted").$type<TransactionStatus>(),
    source: text("source").notNull().$type<TransactionSource>(),
    importId: bigint("import_id", { mode: "number" }).references(() => imports.id, { onDelete: "set null" }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("transactions_account_date_idx").on(table.accountId, table.date),
    index("transactions_category_date_idx").on(table.categoryId, table.date),
  ],
);

export const valuations = pgTable(
  "valuations",
  {
    id: idColumn(),
    accountId: bigint("account_id", { mode: "number" })
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    date: date("date").notNull(),
    balanceCents: bigint("balance_cents", { mode: "number" }).notNull(),
    source: text("source").notNull().$type<ValuationSource>(),
  },
  (table) => [
    uniqueIndex("valuations_account_date_unique").on(table.accountId, table.date),
  ],
);

export const transfers = pgTable("transfers", {
  id: idColumn(),
  inflowTransactionId: bigint("inflow_transaction_id", { mode: "number" })
    .notNull()
    .unique()
    .references(() => transactions.id, { onDelete: "cascade" }),
  outflowTransactionId: bigint("outflow_transaction_id", { mode: "number" })
    .notNull()
    .unique()
    .references(() => transactions.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending").$type<"pending" | "confirmed">(),
});

export const rejectedTransfers = pgTable("rejected_transfers", {
  inflowTransactionId: bigint("inflow_transaction_id", { mode: "number" })
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  outflowTransactionId: bigint("outflow_transaction_id", { mode: "number" })
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
});

export const transactionTags = pgTable(
  "transaction_tags",
  {
    transactionId: bigint("transaction_id", { mode: "number" })
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    tagId: bigint("tag_id", { mode: "number" })
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.transactionId, table.tagId] })],
);
