import { bigint, date, index, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { idColumn, familyIdColumn, createdAtColumn, updatedAtColumn } from "./columns";

export const goals = pgTable("goals", {
  id: idColumn(),
  familyId: familyIdColumn(),
  name: text("name").notNull(),
  targetAmountCents: bigint("target_amount_cents", { mode: "number" }).notNull(),
  targetDate: date("target_date"),
  monthlyContributionCents: bigint("monthly_contribution_cents", { mode: "number" }),
  priority: integer("priority").notNull().default(0),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => [index("goals_family_idx").on(table.familyId)]);

export const goalAccounts = pgTable(
  "goal_accounts",
  {
    goalId: bigint("goal_id", { mode: "number" })
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    accountId: bigint("account_id", { mode: "number" })
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.goalId, table.accountId] })],
);
