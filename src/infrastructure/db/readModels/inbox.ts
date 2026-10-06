import { and, desc, eq } from "drizzle-orm";
import type { InboxReader } from "@/domain/readModels/ports";
import { db } from "../client";
import { recurringCandidates } from "../schema/budgeting";
import { concepts } from "../schema/concepts";
import { conceptMatchSuggestions } from "../schema/matching";
import { transactions } from "../schema/transactions";

export class DrizzleInboxReader implements InboxReader {
  async pendingRecurringCandidates(familyId: number) {
    return db
      .select()
      .from(recurringCandidates)
      .where(and(eq(recurringCandidates.familyId, familyId), eq(recurringCandidates.status, "pending")))
      .orderBy(desc(recurringCandidates.detectedAt));
  }

  async pendingConceptSuggestions(familyId: number) {
    return db
      .select({
        id: conceptMatchSuggestions.id,
        score: conceptMatchSuggestions.score,
        transactionId: transactions.id,
        transactionName: transactions.name,
        transactionDate: transactions.date,
        transactionAmountCents: transactions.amountCents,
        conceptId: concepts.id,
        conceptName: concepts.name,
      })
      .from(conceptMatchSuggestions)
      .innerJoin(transactions, eq(transactions.id, conceptMatchSuggestions.transactionId))
      .innerJoin(concepts, eq(concepts.id, conceptMatchSuggestions.suggestedConceptId))
      .where(and(eq(conceptMatchSuggestions.familyId, familyId), eq(conceptMatchSuggestions.status, "pending")))
      .orderBy(desc(conceptMatchSuggestions.createdAt));
  }
}
