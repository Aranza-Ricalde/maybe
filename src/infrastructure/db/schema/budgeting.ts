import { bigint, bigserial, boolean, date, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { BUDGET_CADENCES, type BudgetCadence } from "@/domain/budget/rules";
import { FLOWS, type Flow } from "@/domain/ledger/rules";
import { checkEnum } from "./_helpers";
import { accounts } from "./accounts";
import { categories } from "./classification";
import { concepts } from "./concepts";
import { families } from "./core";
import { transactions } from "./transactions";

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
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.familyId, table.categoryId] }),
    checkEnum("budget_category_settings_cadence_check", table.cadence, BUDGET_CADENCES),
  ],
);

export const RECURRING_STATUSES = ["active", "paused"] as const;

export const recurringItems = pgTable(
  "recurring_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    flow: text("flow").notNull().$type<Flow>(),
    estimatedAmountCents: bigint("estimated_amount_cents", { mode: "number" }).notNull(),
    categoryId: bigint("category_id", { mode: "number" }).references(() => categories.id, { onDelete: "set null" }),
    conceptId: bigint("concept_id", { mode: "number" }).references(() => concepts.id, { onDelete: "set null" }),
    dayOfMonth: integer("day_of_month").notNull(),
    accountId: bigint("account_id", { mode: "number" }).references(() => accounts.id, { onDelete: "set null" }),
    autoDetected: boolean("auto_detected").notNull().default(false),
    status: text("status").notNull().default("active").$type<(typeof RECURRING_STATUSES)[number]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    checkEnum("recurring_items_flow_check", table.flow, FLOWS),
    checkEnum("recurring_items_status_check", table.status, RECURRING_STATUSES),
  ],
);

export const RECURRING_CANDIDATE_STATUSES = ["pending", "accepted", "dismissed"] as const;

export const recurringCandidates = pgTable(
  "recurring_candidates",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    patternSignature: text("pattern_signature").notNull(),
    suggestedName: text("suggested_name").notNull(),
    suggestedAmountCents: bigint("suggested_amount_cents", { mode: "number" }).notNull(),
    suggestedCategoryId: bigint("suggested_category_id", { mode: "number" }).references(() => categories.id, {
      onDelete: "set null",
    }),
    accountId: bigint("account_id", { mode: "number" }).references(() => accounts.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending").$type<(typeof RECURRING_CANDIDATE_STATUSES)[number]>(),
    acceptedRecurringItemId: bigint("accepted_recurring_item_id", { mode: "number" }).references(
      () => recurringItems.id,
    ),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [checkEnum("recurring_candidates_status_check", table.status, RECURRING_CANDIDATE_STATUSES)],
);

export const SCHEDULED_TRANSACTION_STATUSES = ["planned", "confirmed", "cancelled"] as const;

export const scheduledTransactions = pgTable(
  "scheduled_transactions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    categoryId: bigint("category_id", { mode: "number" }).references(() => categories.id, { onDelete: "set null" }),
    accountId: bigint("account_id", { mode: "number" }).references(() => accounts.id, { onDelete: "set null" }),
    scheduledDate: date("scheduled_date").notNull(),
    status: text("status").notNull().default("planned").$type<(typeof SCHEDULED_TRANSACTION_STATUSES)[number]>(),
    confirmedTransactionId: bigint("confirmed_transaction_id", { mode: "number" }).references(() => transactions.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [checkEnum("scheduled_transactions_status_check", table.status, SCHEDULED_TRANSACTION_STATUSES)],
);
