import { bigint, boolean, date, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { BudgetCadence } from "@/domain/budget/rules";
import type { ScheduledTransactionStatus } from "@/domain/cashflow/rules";
import type { Flow } from "@/domain/ledger/rules";
import type { BudgetInclusion } from "@/domain/recurring/budgetInclusion";
import type { RecurringCandidateStatus, RecurringStatus } from "@/domain/recurring/rules";
import { accounts } from "./accounts";
import { categories } from "./classification";
import { concepts } from "./concepts";
import { families } from "./core";
import { transactions } from "./transactions";
import { idColumn, familyIdColumn, createdAtColumn, updatedAtColumn } from "./columns";

export const budgetCategorySettings = pgTable(
  "budget_category_settings",
  {
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    cadence: text("cadence").notNull().$type<BudgetCadence>(),
    budgetedAmountCents: bigint("budgeted_amount_cents", { mode: "number" }).notNull(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [primaryKey({ columns: [table.familyId, table.categoryId] })],
);

export const recurringItems = pgTable("recurring_items", {
  id: idColumn(),
  familyId: familyIdColumn(),
  name: text("name").notNull(),
  flow: text("flow").notNull().$type<Flow>(),
  estimatedAmountCents: bigint("estimated_amount_cents", { mode: "number" }).notNull(),
  categoryId: bigint("category_id", { mode: "number" }).references(() => categories.id, { onDelete: "set null" }),
  conceptId: bigint("concept_id", { mode: "number" }).references(() => concepts.id, { onDelete: "set null" }),
  dayOfMonth: integer("day_of_month").notNull(),
  accountId: bigint("account_id", { mode: "number" }).references(() => accounts.id, { onDelete: "set null" }),
  autoDetected: boolean("auto_detected").notNull().default(false),
  budgetInclusion: text("budget_inclusion").$type<BudgetInclusion>(),
  status: text("status").notNull().default("active").$type<RecurringStatus>(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => [index("recurring_items_family_idx").on(table.familyId)]);

export const recurringCandidates = pgTable("recurring_candidates", {
  id: idColumn(),
  familyId: familyIdColumn(),
  patternSignature: text("pattern_signature").notNull(),
  suggestedName: text("suggested_name").notNull(),
  suggestedAmountCents: bigint("suggested_amount_cents", { mode: "number" }).notNull(),
  suggestedCategoryId: bigint("suggested_category_id", { mode: "number" }).references(() => categories.id, {
    onDelete: "set null",
  }),
  accountId: bigint("account_id", { mode: "number" }).references(() => accounts.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending").$type<RecurringCandidateStatus>(),
  acceptedRecurringItemId: bigint("accepted_recurring_item_id", { mode: "number" }).references(
    () => recurringItems.id,
  ),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scheduledTransactions = pgTable("scheduled_transactions", {
  id: idColumn(),
  familyId: familyIdColumn(),
  name: text("name").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  categoryId: bigint("category_id", { mode: "number" }).references(() => categories.id, { onDelete: "set null" }),
  accountId: bigint("account_id", { mode: "number" }).references(() => accounts.id, { onDelete: "set null" }),
  scheduledDate: date("scheduled_date").notNull(),
  status: text("status").notNull().default("planned").$type<ScheduledTransactionStatus>(),
  confirmedTransactionId: bigint("confirmed_transaction_id", { mode: "number" }).references(() => transactions.id),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => [index("scheduled_transactions_family_idx").on(table.familyId)]);
