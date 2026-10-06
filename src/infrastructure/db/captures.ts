import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { CAPTURE_REVIEW, CAPTURE_SOURCES, TOP_CATEGORIES_WINDOW_DAYS } from "@/domain/captures/rules";
import type { CaptureAccount, CaptureOutcome, CaptureRepository, CapturedTransactionView, PendingCapture } from "@/domain/captures/ports";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { categories, merchantPatterns } from "./schema/classification";
import { transactionReviews } from "./schema/reviews";
import { transactions } from "./schema/transactions";

const reviewIs = (familyId: number, transactionId: number) => and(eq(transactionReviews.familyId, familyId), eq(transactionReviews.transactionId, transactionId), eq(transactionReviews.topic, CAPTURE_REVIEW.topic));

export class DrizzleCaptureRepository implements CaptureRepository {
  async findCaptured(familyId: number, transactionId: number): Promise<CapturedTransactionView | null> {
    const [row] = await db
      .select({
        transactionId: transactions.id,
        name: transactions.name,
        amountCents: transactions.amountCents,
        accountName: accounts.name,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        merchantName: merchantPatterns.cleanName,
        reviewId: transactionReviews.id,
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .leftJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
      .leftJoin(transactionReviews, and(eq(transactionReviews.transactionId, transactions.id), eq(transactionReviews.topic, CAPTURE_REVIEW.topic), eq(transactionReviews.decision, CAPTURE_REVIEW.pending)))
      .where(and(eq(transactions.id, transactionId), eq(accounts.familyId, familyId), inArray(transactions.source, [...CAPTURE_SOURCES])))
      .limit(1);
    if (!row) return null;
    const { reviewId, ...view } = row;
    return { ...view, needsConfirmation: reviewId != null };
  }

  async topCategories(familyId: number, flow: "expense" | "income", limit: number): Promise<Array<{ id: number; name: string }>> {
    const uses = sql<number>`count(${transactions.id})`;
    return db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .leftJoin(transactions, and(eq(transactions.categoryId, categories.id), sql`${transactions.date} >= current_date - ${TOP_CATEGORIES_WINDOW_DAYS}::int`))
      .where(and(eq(categories.familyId, familyId), eq(categories.classification, flow)))
      .groupBy(categories.id, categories.name)
      .orderBy(desc(uses), asc(categories.name))
      .limit(limit);
  }

  async listActiveAccounts(familyId: number): Promise<CaptureAccount[]> {
    return db.select({ id: accounts.id, name: accounts.name }).from(accounts).where(and(eq(accounts.familyId, familyId), eq(accounts.isActive, true))).orderBy(asc(accounts.id));
  }

  async outcomeOf(transactionId: number): Promise<CaptureOutcome | null> {
    const [row] = await db
      .select({ categoryId: transactions.categoryId, categoryName: categories.name, merchantName: merchantPatterns.cleanName })
      .from(transactions)
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .leftJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
      .where(eq(transactions.id, transactionId))
      .limit(1);
    return row ?? null;
  }

  async markPending(familyId: number, transactionId: number): Promise<void> {
    await db
      .insert(transactionReviews)
      .values({ familyId, transactionId, topic: CAPTURE_REVIEW.topic, decision: CAPTURE_REVIEW.pending })
      .onConflictDoUpdate({ target: [transactionReviews.transactionId, transactionReviews.topic], set: { decision: CAPTURE_REVIEW.pending, decidedAt: new Date() } });
  }

  async isPending(familyId: number, transactionId: number): Promise<boolean> {
    const [row] = await db.select({ id: transactionReviews.id }).from(transactionReviews).where(and(reviewIs(familyId, transactionId), eq(transactionReviews.decision, CAPTURE_REVIEW.pending))).limit(1);
    return Boolean(row);
  }

  async markConfirmed(familyId: number, transactionId: number): Promise<void> {
    await db.update(transactionReviews).set({ decision: CAPTURE_REVIEW.confirmed, decidedAt: new Date() }).where(reviewIs(familyId, transactionId));
  }

  async listPending(familyId: number): Promise<PendingCapture[]> {
    return db
      .select({
        transactionId: transactions.id,
        date: transactions.date,
        name: transactions.name,
        amountCents: transactions.amountCents,
        accountName: accounts.name,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        source: transactions.source,
      })
      .from(transactionReviews)
      .innerJoin(transactions, eq(transactions.id, transactionReviews.transactionId))
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(and(eq(transactionReviews.familyId, familyId), eq(transactionReviews.topic, CAPTURE_REVIEW.topic), eq(transactionReviews.decision, CAPTURE_REVIEW.pending)))
      .orderBy(asc(transactions.date), asc(transactions.id));
  }
}
