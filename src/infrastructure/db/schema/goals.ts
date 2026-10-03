import { bigint, bigserial, date, integer, pgTable, primaryKey, timestamp, text } from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { families } from "./core";

export const goals = pgTable("goals", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  familyId: bigint("family_id", { mode: "number" })
    .notNull()
    .references(() => families.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  targetAmountCents: bigint("target_amount_cents", { mode: "number" }).notNull(),
  targetDate: date("target_date"),
  monthlyContributionCents: bigint("monthly_contribution_cents", { mode: "number" }),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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
