import { bigint, bigserial, date, pgTable, uniqueIndex } from "drizzle-orm/pg-core";
import { families } from "./core";

export const payPeriods = pgTable(
  "pay_periods",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    start: date("start").notNull(),
    end: date("end").notNull(),
  },
  (table) => [uniqueIndex("pay_periods_family_start_unique").on(table.familyId, table.start)],
);
