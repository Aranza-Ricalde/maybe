import { and, eq, gte, inArray, or } from "drizzle-orm";
import type { DetectionAccount, DetectionTransaction } from "@/domain/transfers/detection";
import type { TransferReviewRepository } from "@/domain/transfers/ports";
import type { ReviewDecision, ReviewTopic } from "@/domain/transfers/rules";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { categories } from "./schema/classification";
import { transactionReviews } from "./schema/reviews";
import { rejectedTransfers, transactions, transfers } from "./schema/transactions";

export class DrizzleTransferReviewRepository implements TransferReviewRepository {
  async listAccounts(familyId: number): Promise<DetectionAccount[]> {
    return db.select({ id: accounts.id, name: accounts.name, type: accounts.type }).from(accounts).where(eq(accounts.familyId, familyId));
  }

  async listStandardTransactions(familyId: number, sinceDate?: string): Promise<DetectionTransaction[]> {
    return db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        date: transactions.date,
        amountCents: transactions.amountCents,
        name: transactions.name,
        kind: transactions.kind,
        categoryName: categories.name,
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(and(eq(accounts.familyId, familyId), eq(transactions.kind, "standard"), sinceDate ? gte(transactions.date, sinceDate) : undefined));
  }

  async listRejectedPairs(familyId: number): Promise<Array<{ outflowId: number; inflowId: number }>> {
    return db
      .select({ outflowId: rejectedTransfers.outflowTransactionId, inflowId: rejectedTransfers.inflowTransactionId })
      .from(rejectedTransfers)
      .innerJoin(transactions, eq(transactions.id, rejectedTransfers.outflowTransactionId))
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(eq(accounts.familyId, familyId));
  }

  async listDecidedTransactionIds(familyId: number, topic: ReviewTopic, decision: ReviewDecision): Promise<number[]> {
    const rows = await db
      .select({ id: transactionReviews.transactionId })
      .from(transactionReviews)
      .where(and(eq(transactionReviews.familyId, familyId), eq(transactionReviews.topic, topic), eq(transactionReviews.decision, decision)));
    return rows.map((r) => r.id);
  }

  async rejectPair(outflowId: number, inflowId: number): Promise<void> {
    const [existing] = await db
      .select({ id: rejectedTransfers.outflowTransactionId })
      .from(rejectedTransfers)
      .where(and(eq(rejectedTransfers.outflowTransactionId, outflowId), eq(rejectedTransfers.inflowTransactionId, inflowId)))
      .limit(1);
    if (!existing) await db.insert(rejectedTransfers).values({ outflowTransactionId: outflowId, inflowTransactionId: inflowId });
  }

  async recordDecision(familyId: number, transactionId: number, topic: ReviewTopic, decision: ReviewDecision): Promise<void> {
    await db
      .insert(transactionReviews)
      .values({ familyId, transactionId, topic, decision })
      .onConflictDoUpdate({ target: [transactionReviews.transactionId, transactionReviews.topic], set: { decision, decidedAt: new Date() } });
  }

  async allBelongToFamily(familyId: number, transactionIds: number[]): Promise<boolean> {
    if (transactionIds.length === 0) return false;
    const rows = await db
      .select({ id: transactions.id })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(and(eq(accounts.familyId, familyId), inArray(transactions.id, transactionIds)));
    return rows.length === new Set(transactionIds).size;
  }

  async isConfirmedByReview(transactionId: number): Promise<boolean> {
    const [row] = await db
      .select({ id: transactionReviews.id })
      .from(transactionReviews)
      .where(and(eq(transactionReviews.transactionId, transactionId), eq(transactionReviews.topic, "transfer_suspicion"), eq(transactionReviews.decision, "confirmed_transfer")))
      .limit(1);
    return Boolean(row);
  }

  async clearDecisions(transactionIds: number[], topic: ReviewTopic): Promise<void> {
    if (transactionIds.length === 0) return;
    await db.delete(transactionReviews).where(and(inArray(transactionReviews.transactionId, transactionIds), eq(transactionReviews.topic, topic)));
  }

  async isLinkedTransfer(transactionId: number): Promise<boolean> {
    const [row] = await db
      .select({ id: transfers.id })
      .from(transfers)
      .where(or(eq(transfers.inflowTransactionId, transactionId), eq(transfers.outflowTransactionId, transactionId)))
      .limit(1);
    return Boolean(row);
  }
}
