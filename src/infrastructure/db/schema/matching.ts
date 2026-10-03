import { bigint, bigserial, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { checkEnum } from "./_helpers";
import { concepts } from "./concepts";
import { families } from "./core";
import { transactions } from "./transactions";

export const CONCEPT_MATCH_SUGGESTION_STATUSES = ["pending", "confirmed", "rejected"] as const;

export const conceptMatchSuggestions = pgTable(
  "concept_match_suggestions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    familyId: bigint("family_id", { mode: "number" })
      .notNull()
      .references(() => families.id, { onDelete: "restrict" }),
    transactionId: bigint("transaction_id", { mode: "number" })
      .notNull()
      .unique()
      .references(() => transactions.id, { onDelete: "cascade" }),
    suggestedConceptId: bigint("suggested_concept_id", { mode: "number" })
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    status: text("status").notNull().default("pending").$type<(typeof CONCEPT_MATCH_SUGGESTION_STATUSES)[number]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [checkEnum("concept_match_suggestions_status_check", table.status, CONCEPT_MATCH_SUGGESTION_STATUSES)],
);
