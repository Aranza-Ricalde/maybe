import { bigint, date, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { categories } from "./classification";
import { families } from "./core";

export const categoryMonthlyTotals = pgTable(
  "category_monthly_totals",
  {
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    month: date("month").notNull(),
    totalCents: bigint("total_cents", { mode: "number" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.familyId, table.categoryId, table.month] })],
);

export const incomeExpenseMonthly = pgTable(
  "income_expense_monthly",
  {
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    month: date("month").notNull(),
    incomeCents: bigint("income_cents", { mode: "number" }).notNull(),
    expenseCents: bigint("expense_cents", { mode: "number" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.familyId, table.month] })],
);
