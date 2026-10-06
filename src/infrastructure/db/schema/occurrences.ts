import { bigint, date, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { OccurrenceMatchSource, RecurringOccurrenceStatus } from "@/domain/recurring/rules";
import { recurringItems } from "./budgeting";
import { families } from "./core";
import { transactions } from "./transactions";
import { idColumn, createdAtColumn } from "./columns";

export const recurringOccurrences = pgTable(
  "recurring_occurrences",
  {
    id: idColumn(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    recurringItemId: bigint("recurring_item_id", { mode: "number" })
      .notNull()
      .references(() => recurringItems.id, { onDelete: "cascade" }),
    expectedDate: date("expected_date").notNull(),
    expectedAmountCents: bigint("expected_amount_cents", { mode: "number" }).notNull(),
    status: text("status").notNull().$type<RecurringOccurrenceStatus>(),
    transactionId: bigint("transaction_id", { mode: "number" }).references(() => transactions.id, { onDelete: "set null" }),
    matchSource: text("match_source").$type<OccurrenceMatchSource>(),
    matchScore: integer("match_score"),
    matchedAt: timestamp("matched_at", { withTimezone: true }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("recurring_occurrences_item_date_unique").on(table.recurringItemId, table.expectedDate),
    uniqueIndex("recurring_occurrences_transaction_unique")
      .on(table.transactionId)
      .where(sql`${table.transactionId} IS NOT NULL`),
    index("recurring_occurrences_family_date_idx").on(table.familyId, table.expectedDate),
  ],
);
