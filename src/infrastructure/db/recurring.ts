import { and, eq, gte, inArray } from "drizzle-orm";
import type { RecurringCandidateRecord, RecurringCandidateRepository } from "@/domain/recurring/ports";
import type { RecurringGroupResult, TransactionForDetection } from "@/domain/recurring/rules";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { recurringCandidates } from "./schema/budgeting";
import { transactions } from "./schema/transactions";

function monthsAgoIso(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

export class DrizzleRecurringCandidateRepository implements RecurringCandidateRepository {
  async getRecentTransactions(familyId: number, monthsBack: number): Promise<TransactionForDetection[]> {
    const since = monthsAgoIso(monthsBack);
    const rows = await db
      .select({
        accountId: transactions.accountId,
        date: transactions.date,
        amountCents: transactions.amountCents,
        categoryId: transactions.categoryId,
        merchantId: transactions.merchantId,
        name: transactions.name,
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(
        and(eq(accounts.familyId, familyId), eq(transactions.kind, "standard"), gte(transactions.date, since)),
      );
    return rows;
  }

  async findExistingPatternSignatures(familyId: number, patternSignatures: string[]): Promise<Set<string>> {
    if (patternSignatures.length === 0) return new Set();
    const rows = await db
      .select({ patternSignature: recurringCandidates.patternSignature })
      .from(recurringCandidates)
      .where(and(eq(recurringCandidates.familyId, familyId), inArray(recurringCandidates.patternSignature, patternSignatures)));
    return new Set(rows.map((r) => r.patternSignature));
  }

  async createCandidates(familyId: number, groups: RecurringGroupResult[]): Promise<RecurringCandidateRecord[]> {
    if (groups.length === 0) return [];
    const rows = await db
      .insert(recurringCandidates)
      .values(
        groups.map((group) => ({
          familyId,
          patternSignature: group.patternSignature,
          suggestedName: group.suggestedName,
          suggestedAmountCents: group.suggestedAmountCents,
          suggestedCategoryId: group.suggestedCategoryId,
          accountId: group.accountId,
          status: "pending" as const,
        })),
      )
      .returning();
    return rows;
  }

  async getById(id: number): Promise<RecurringCandidateRecord | null> {
    const [row] = await db.select().from(recurringCandidates).where(eq(recurringCandidates.id, id));
    return row ?? null;
  }

  async markAccepted(id: number, acceptedRecurringItemId: number): Promise<void> {
    await db.update(recurringCandidates).set({ status: "accepted", acceptedRecurringItemId }).where(eq(recurringCandidates.id, id));
  }

  async markDismissed(id: number): Promise<void> {
    await db.update(recurringCandidates).set({ status: "dismissed" }).where(eq(recurringCandidates.id, id));
  }

  async clearAcceptedRecurringItemId(recurringItemId: number): Promise<void> {
    await db
      .update(recurringCandidates)
      .set({ acceptedRecurringItemId: null })
      .where(eq(recurringCandidates.acceptedRecurringItemId, recurringItemId));
  }
}
