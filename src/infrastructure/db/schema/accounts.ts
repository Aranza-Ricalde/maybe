import { sql } from "drizzle-orm";
import { bigint, bigserial, boolean, date, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { ACCOUNT_TYPES, type AccountType } from "@/domain/accounts/rules";
import { checkEnum } from "./_helpers";
import { families } from "./core";

const CLASSIFICATION_SQL = sql`CASE WHEN type IN ('credit_card', 'loan', 'other_liability') THEN 'liability' ELSE 'asset' END`;

export const accounts = pgTable(
  "accounts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    type: text("type").notNull().$type<AccountType>(),
    classification: text("classification").notNull().generatedAlwaysAs(CLASSIFICATION_SQL),
    details: jsonb("details").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [checkEnum("accounts_type_check", table.type, ACCOUNT_TYPES)],
);

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
