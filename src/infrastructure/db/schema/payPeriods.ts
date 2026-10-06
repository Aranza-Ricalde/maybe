import { bigint, date, pgTable, uniqueIndex } from "drizzle-orm/pg-core";
import { families } from "./core";
import { idColumn } from "./columns";

export const payPeriods = pgTable(
  "pay_periods",
  {
    id: idColumn(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    start: date("start").notNull(),
    end: date("end").notNull(),
  },
  (table) => [uniqueIndex("pay_periods_family_start_unique").on(table.familyId, table.start)],
);
