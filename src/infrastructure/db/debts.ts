import { and, gte, ilike, inArray, lt, lte, gt, sql } from "drizzle-orm";
import type { DebtMovementStats, DebtPaymentRecord, DebtsRepository, LiabilityAccountRecord } from "@/domain/debts/ports";
import { activeAccountsOf, balancesOfActiveAccounts } from "./accountsContext";
import { db } from "./client";
import { transactions } from "./schema/transactions";

export class DrizzleDebtsRepository implements DebtsRepository {
  async listLiabilityAccounts(familyId: number, asOfDate: string): Promise<LiabilityAccountRecord[]> {
    const rows = (await activeAccountsOf(familyId)).filter((row) => row.classification === "liability").sort((a, b) => a.id - b.id);
    const balances = await balancesOfActiveAccounts(familyId, asOfDate);
    return rows.map((r) => ({ id: r.id, name: r.name, type: r.type, balanceCents: balances.get(r.id) ?? 0, details: (r.details as Record<string, unknown> | null) ?? null }));
  }

  async listPayments(accountIds: number[], fromDate: string, toDate: string): Promise<DebtPaymentRecord[]> {
    if (accountIds.length === 0) return [];
    return db
      .select({ accountId: transactions.accountId, date: transactions.date, amountCents: transactions.amountCents, name: transactions.name })
      .from(transactions)
      .where(and(inArray(transactions.accountId, accountIds), gt(transactions.amountCents, 0), gte(transactions.date, fromDate), lte(transactions.date, toDate)));
  }

  async getMovementStats(accountIds: number[], paymentsFrom: string, interestFrom: string, asOfDate: string): Promise<Map<number, DebtMovementStats>> {
    const stats = new Map<number, DebtMovementStats>(accountIds.map((id) => [id, { paymentsCents: 0, interestCents: 0 }]));
    if (accountIds.length === 0) return stats;

    const payments = await db
      .select({ accountId: transactions.accountId, total: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`.mapWith(Number) })
      .from(transactions)
      .where(and(inArray(transactions.accountId, accountIds), gt(transactions.amountCents, 0), gte(transactions.date, paymentsFrom), lte(transactions.date, asOfDate)))
      .groupBy(transactions.accountId);
    for (const p of payments) (stats.get(p.accountId) as DebtMovementStats).paymentsCents = p.total;

    const interest = await db
      .select({ accountId: transactions.accountId, total: sql<number>`coalesce(-sum(${transactions.amountCents}), 0)`.mapWith(Number) })
      .from(transactions)
      .where(and(inArray(transactions.accountId, accountIds), lt(transactions.amountCents, 0), ilike(transactions.name, "%inter_s%"), gte(transactions.date, interestFrom), lte(transactions.date, asOfDate)))
      .groupBy(transactions.accountId);
    for (const i of interest) (stats.get(i.accountId) as DebtMovementStats).interestCents = i.total;
    return stats;
  }
}
