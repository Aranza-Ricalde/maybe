import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";
import type { ConceptMatchSuggestionStatus } from "@/domain/matching/rules";
import { concepts } from "./concepts";
import { transactions } from "./transactions";
import { idColumn, familyIdColumn, createdAtColumn } from "./columns";

export const conceptMatchSuggestions = pgTable("concept_match_suggestions", {
  id: idColumn(),
  familyId: familyIdColumn(),
  transactionId: bigint("transaction_id", { mode: "number" })
    .notNull()
    .unique()
    .references(() => transactions.id, { onDelete: "cascade" }),
  suggestedConceptId: bigint("suggested_concept_id", { mode: "number" })
    .notNull()
    .references(() => concepts.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  status: text("status").notNull().default("pending").$type<ConceptMatchSuggestionStatus>(),
  createdAt: createdAtColumn(),
});
