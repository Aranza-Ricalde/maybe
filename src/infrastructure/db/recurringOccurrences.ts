import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { CalendarOccurrenceInput } from "@/domain/calendar/rules";
import type { LinkableTransaction, OccurrenceForLink, RecurringOccurrencesRepository } from "@/domain/recurring/ports";
import type { OccurrenceMatchSource, RecurringOccurrenceStatus } from "@/domain/recurring/rules";
import type { OccurrenceSyncPlan, RecurringItemForOccurrences, StoredOccurrence, TransactionForOccurrences } from "@/domain/recurring/occurrences";
import { db } from "./client";
import { transactionsBetween } from "./periodTransactions";
import { accounts } from "./schema/accounts";
import { recurringItems } from "./schema/budgeting";
import { concepts } from "./schema/concepts";
import { recurringOccurrences } from "./schema/occurrences";
import { transactions } from "./schema/transactions";

export class DrizzleRecurringOccurrencesRepository implements RecurringOccurrencesRepository {
  async getRecurringItems(familyId: number): Promise<RecurringItemForOccurrences[]> {
    return db
      .select({
        id: recurringItems.id,
        status: recurringItems.status,
        flow: recurringItems.flow,
        dayOfMonth: recurringItems.dayOfMonth,
        estimatedAmountCents: recurringItems.estimatedAmountCents,
        conceptId: recurringItems.conceptId,
        categoryId: recurringItems.categoryId,
        providerId: concepts.providerId,
        accountId: recurringItems.accountId,
      })
      .from(recurringItems)
      .leftJoin(concepts, eq(concepts.id, recurringItems.conceptId))
      .where(eq(recurringItems.familyId, familyId));
  }

  async listOccurrences(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<StoredOccurrence[]> {
    return db
      .select({
        id: recurringOccurrences.id,
        recurringItemId: recurringOccurrences.recurringItemId,
        expectedDate: recurringOccurrences.expectedDate,
        expectedAmountCents: recurringOccurrences.expectedAmountCents,
        status: recurringOccurrences.status,
        transactionId: recurringOccurrences.transactionId,
        matchSource: recurringOccurrences.matchSource,
      })
      .from(recurringOccurrences)
      .where(
        and(
          eq(recurringOccurrences.familyId, familyId),
          gte(recurringOccurrences.expectedDate, fromDateInclusive),
          lte(recurringOccurrences.expectedDate, toDateInclusive),
        ),
      );
  }

  async listTransactions(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<TransactionForOccurrences[]> {
    return transactionsBetween(familyId, fromDateInclusive, toDateInclusive);
  }

  async listForCalendar(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<CalendarOccurrenceInput[]> {
    const rows = await db
      .select({
        id: recurringOccurrences.id,
        name: recurringItems.name,
        flow: recurringItems.flow,
        expectedDate: recurringOccurrences.expectedDate,
        expectedAmountCents: recurringOccurrences.expectedAmountCents,
        status: recurringOccurrences.status,
        matchSource: recurringOccurrences.matchSource,
        transactionId: transactions.id,
        transactionName: transactions.name,
        transactionDate: transactions.date,
        transactionAmountCents: transactions.amountCents,
      })
      .from(recurringOccurrences)
      .innerJoin(recurringItems, eq(recurringItems.id, recurringOccurrences.recurringItemId))
      .leftJoin(transactions, eq(transactions.id, recurringOccurrences.transactionId))
      .where(
        and(
          eq(recurringOccurrences.familyId, familyId),
          eq(recurringItems.status, "active"),
          gte(recurringOccurrences.expectedDate, fromDateInclusive),
          lte(recurringOccurrences.expectedDate, toDateInclusive),
        ),
      );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      flow: r.flow,
      expectedDate: r.expectedDate,
      expectedAmountCents: r.expectedAmountCents,
      status: r.status,
      matchSource: r.matchSource,
      transaction:
        r.transactionId != null && r.transactionName != null && r.transactionDate != null && r.transactionAmountCents != null
          ? { id: r.transactionId, name: r.transactionName, date: r.transactionDate, amountCents: r.transactionAmountCents }
          : null,
    }));
  }

  async getOccurrence(id: number): Promise<{ id: number; familyId: number } | null> {
    const [row] = await db
      .select({ id: recurringOccurrences.id, familyId: recurringOccurrences.familyId })
      .from(recurringOccurrences)
      .where(eq(recurringOccurrences.id, id));
    return row ?? null;
  }

  async getOccurrenceForLink(id: number): Promise<OccurrenceForLink | null> {
    const [row] = await db
      .select({
        id: recurringOccurrences.id,
        familyId: recurringOccurrences.familyId,
        flow: recurringItems.flow,
        expectedDate: recurringOccurrences.expectedDate,
        expectedAmountCents: recurringOccurrences.expectedAmountCents,
        status: recurringOccurrences.status,
        transactionId: recurringOccurrences.transactionId,
      })
      .from(recurringOccurrences)
      .innerJoin(recurringItems, eq(recurringItems.id, recurringOccurrences.recurringItemId))
      .where(eq(recurringOccurrences.id, id));
    return row ?? null;
  }

  async listLinkableTransactions(familyId: number, fromDateInclusive: string, toDateInclusive: string): Promise<LinkableTransaction[]> {
    return db
      .select({ id: transactions.id, name: transactions.name, date: transactions.date, amountCents: transactions.amountCents, accountName: accounts.name })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(recurringOccurrences, eq(recurringOccurrences.transactionId, transactions.id))
      .where(
        and(
          eq(accounts.familyId, familyId),
          eq(transactions.kind, "standard"),
          isNull(recurringOccurrences.id),
          gte(transactions.date, fromDateInclusive),
          lte(transactions.date, toDateInclusive),
        ),
      );
  }

  async linkTransaction(occurrenceId: number, transactionId: number): Promise<void> {
    await db
      .update(recurringOccurrences)
      .set({ status: "paid", matchSource: "manual", transactionId, matchScore: null, matchedAt: new Date() })
      .where(eq(recurringOccurrences.id, occurrenceId));
  }

  async applyDecision(id: number, outcome: { status: RecurringOccurrenceStatus; matchSource: OccurrenceMatchSource }): Promise<void> {
    await db
      .update(recurringOccurrences)
      .set({
        status: outcome.status,
        matchSource: outcome.matchSource,
        transactionId: null,
        matchScore: null,
        matchedAt: outcome.status === "paid" ? new Date() : null,
      })
      .where(eq(recurringOccurrences.id, id));
  }

  async applyPlan(familyId: number, plan: OccurrenceSyncPlan): Promise<void> {
    await db.transaction(async (tx) => {
      if (plan.toDelete.length > 0) {
        await tx
          .delete(recurringOccurrences)
          .where(and(eq(recurringOccurrences.familyId, familyId), inArray(recurringOccurrences.id, plan.toDelete), eq(recurringOccurrences.status, "pending")));
      }

      if (plan.toRefreshAmount.length > 0) {
        const rows = sql.join(plan.toRefreshAmount.map((r) => sql`(${r.occurrenceId}::bigint, ${r.expectedAmountCents}::bigint)`), sql`, `);
        await tx.execute(sql`
          UPDATE recurring_occurrences AS o
          SET expected_amount_cents = v.amount_cents
          FROM (VALUES ${rows}) AS v(id, amount_cents)
          WHERE o.id = v.id AND o.family_id = ${familyId} AND o.status = 'pending'
        `);
      }

      if (plan.toUnlink.length > 0) {
        await tx
          .update(recurringOccurrences)
          .set({ status: "pending", transactionId: null, matchSource: null, matchScore: null, matchedAt: null })
          .where(and(eq(recurringOccurrences.familyId, familyId), inArray(recurringOccurrences.id, plan.toUnlink)));
      }

      const now = new Date();
      if (plan.toLink.length > 0) {
        const rows = sql.join(plan.toLink.map((l) => sql`(${l.occurrenceId}::bigint, ${l.transactionId}::bigint, ${l.matchScore}::integer)`), sql`, `);
        await tx.execute(sql`
          UPDATE recurring_occurrences AS o
          SET status = 'paid', transaction_id = v.transaction_id, match_source = 'auto', match_score = v.match_score, matched_at = ${now.toISOString()}::timestamptz
          FROM (VALUES ${rows}) AS v(id, transaction_id, match_score)
          WHERE o.id = v.id AND o.family_id = ${familyId}
        `);
      }

      if (plan.toCreate.length > 0) {
        await tx
          .insert(recurringOccurrences)
          .values(
            plan.toCreate.map((o) => ({
              familyId,
              recurringItemId: o.recurringItemId,
              expectedDate: o.expectedDate,
              expectedAmountCents: o.expectedAmountCents,
              status: o.status,
              transactionId: o.transactionId,
              matchSource: o.matchSource,
              matchScore: o.matchScore,
              matchedAt: o.transactionId != null ? now : null,
            })),
          )
          .onConflictDoNothing({ target: [recurringOccurrences.recurringItemId, recurringOccurrences.expectedDate] });
      }
    });
  }
}
