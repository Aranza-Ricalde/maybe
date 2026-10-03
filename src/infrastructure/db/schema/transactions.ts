import { bigint, bigserial, date, index, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { checkEnum } from "./_helpers";
import { accounts } from "./accounts";
import { categories, merchantPatterns, tags } from "./classification";
import { concepts } from "./concepts";
import { imports } from "./imports";

export const TRANSACTION_KINDS = ["standard", "transfer", "loan_payment", "cc_payment", "adjustment"] as const;
export const TRANSACTION_STATUSES = ["posted", "pending"] as const;
export const TRANSACTION_SOURCES = ["manual", "csv_import", "telegram"] as const;

export const transactions = pgTable(
  "transactions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
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
    kind: text("kind").notNull().default("standard").$type<(typeof TRANSACTION_KINDS)[number]>(),
    status: text("status").notNull().default("posted").$type<(typeof TRANSACTION_STATUSES)[number]>(),
    source: text("source").notNull().$type<(typeof TRANSACTION_SOURCES)[number]>(),
    importId: bigint("import_id", { mode: "number" }).references(() => imports.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    checkEnum("transactions_kind_check", table.kind, TRANSACTION_KINDS),
    checkEnum("transactions_status_check", table.status, TRANSACTION_STATUSES),
    checkEnum("transactions_source_check", table.source, TRANSACTION_SOURCES),
    index("transactions_account_date_idx").on(table.accountId, table.date),
    index("transactions_category_date_idx").on(table.categoryId, table.date),
  ],
);

export const valuations = pgTable(
  "valuations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    accountId: bigint("account_id", { mode: "number" })
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    date: date("date").notNull(),
    balanceCents: bigint("balance_cents", { mode: "number" }).notNull(),
    source: text("source").notNull().$type<"manual" | "csv_import">(),
  },
  (table) => [
    checkEnum("valuations_source_check", table.source, ["manual", "csv_import"]),
    uniqueIndex("valuations_account_date_unique").on(table.accountId, table.date),
  ],
);

export const transfers = pgTable("transfers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
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
