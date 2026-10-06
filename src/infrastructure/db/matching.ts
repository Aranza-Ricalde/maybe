import { and, eq } from "drizzle-orm";
import type { ConceptMatchingRepository, ConceptMatchSuggestionRecord, TransactionForMatching, TransactionMerchant } from "@/domain/matching/ports";
import type { ConceptMatchCandidate } from "@/domain/matching/rules";
import { db } from "./client";
import { merchantPatterns } from "./schema/classification";
import { concepts } from "./schema/concepts";
import { recurringItems } from "./schema/budgeting";
import { conceptMatchSuggestions } from "./schema/matching";
import { transactions } from "./schema/transactions";

export class DrizzleConceptMatchingRepository implements ConceptMatchingRepository {
  async getTransactionForMatching(transactionId: number): Promise<TransactionForMatching | null> {
    const [row] = await db
      .select({
        accountId: transactions.accountId,
        date: transactions.date,
        amountCents: transactions.amountCents,
        categoryId: transactions.categoryId,
        kind: transactions.kind,
        rawDescription: transactions.rawDescription,
        name: transactions.name,
      })
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);
    return row ? { ...row, rawDescription: row.rawDescription ?? null } : null;
  }

  async getTransactionMerchant(transactionId: number): Promise<TransactionMerchant | null> {
    const [row] = await db
      .select({ merchantName: merchantPatterns.cleanName, providerId: merchantPatterns.providerId })
      .from(transactions)
      .innerJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
      .where(eq(transactions.id, transactionId));
    return row ?? null;
  }

  async listConceptCandidates(familyId: number): Promise<ConceptMatchCandidate[]> {
    const rows = await db
      .select({
        conceptId: concepts.id,
        categoryId: concepts.categoryId,
        providerId: concepts.providerId,
        habitualAccountId: recurringItems.accountId,
        expectedAmountCents: recurringItems.estimatedAmountCents,
        expectedDayOfMonth: recurringItems.dayOfMonth,
      })
      .from(concepts)
      .leftJoin(recurringItems, and(eq(recurringItems.conceptId, concepts.id), eq(recurringItems.status, "active")))
      .where(eq(concepts.familyId, familyId));

    return rows.map((r) => ({
      conceptId: r.conceptId,
      categoryId: r.categoryId,
      providerId: r.providerId,
      habitualAccountId: r.habitualAccountId ?? null,
      expectedAmountCents: r.expectedAmountCents ?? null,
      expectedDayOfMonth: r.expectedDayOfMonth ?? null,
    }));
  }

  async setTransactionMerchant(transactionId: number, merchantId: number): Promise<void> {
    await db.update(transactions).set({ merchantId, updatedAt: new Date() }).where(eq(transactions.id, transactionId));
  }

  async assignConcept(transactionId: number, conceptId: number): Promise<void> {
    await db.update(transactions).set({ conceptId, updatedAt: new Date() }).where(eq(transactions.id, transactionId));
  }

  async createSuggestion(familyId: number, transactionId: number, conceptId: number, score: number): Promise<void> {
    await db
      .insert(conceptMatchSuggestions)
      .values({ familyId, transactionId, suggestedConceptId: conceptId, score })
      .onConflictDoUpdate({
        target: [conceptMatchSuggestions.transactionId],
        set: { suggestedConceptId: conceptId, score, status: "pending" },
      });
  }

  async getSuggestionById(id: number): Promise<ConceptMatchSuggestionRecord | null> {
    const [row] = await db.select().from(conceptMatchSuggestions).where(eq(conceptMatchSuggestions.id, id));
    return row ?? null;
  }

  async markSuggestionRejected(id: number): Promise<void> {
    await db.update(conceptMatchSuggestions).set({ status: "rejected" }).where(eq(conceptMatchSuggestions.id, id));
  }

  async deleteSuggestion(id: number): Promise<void> {
    await db.delete(conceptMatchSuggestions).where(eq(conceptMatchSuggestions.id, id));
  }
}
