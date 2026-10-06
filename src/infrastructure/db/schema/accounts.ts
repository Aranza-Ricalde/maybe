import { sql } from "drizzle-orm";
import { bigint, boolean, date, index, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import type { AccountType } from "@/domain/accounts/rules";
import { idColumn, familyIdColumn, createdAtColumn, updatedAtColumn } from "./columns";

const CLASSIFICATION_SQL = sql`CASE WHEN type IN ('credit_card', 'loan', 'other_liability') THEN 'liability' ELSE 'asset' END`;

export const accounts = pgTable("accounts", {
  id: idColumn(),
  familyId: familyIdColumn(),
  name: text("name").notNull(),
  type: text("type").notNull().$type<AccountType>(),
  classification: text("classification").notNull().generatedAlwaysAs(CLASSIFICATION_SQL),
  details: jsonb("details").$type<Record<string, unknown>>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => [index("accounts_family_idx").on(table.familyId)]);

export const accountBalancesDaily = pgTable(
  "account_balances_daily",
  {
    accountId: bigint("account_id", { mode: "number" })
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    balanceCents: bigint("balance_cents", { mode: "number" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.accountId, table.date] })],
);
