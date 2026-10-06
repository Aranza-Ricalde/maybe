import { and, eq, gte, lt, lte, sql } from "drizzle-orm";
import type { MerchantSpendRow } from "@/domain/spendingAnalysis/rules";
import type { SpendingAnalysisRepository } from "@/domain/spendingAnalysis/ports";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { merchantPatterns } from "./schema/classification";
import { providers } from "./schema/providers";
import { transactions } from "./schema/transactions";

const UNIDENTIFIED_PROVIDER = "Sin identificar";

export class DrizzleSpendingAnalysisRepository implements SpendingAnalysisRepository {
  async listMerchantSpend(familyId: number, fromDate: string, toDate: string): Promise<MerchantSpendRow[]> {
    const merchant = sql<string>`coalesce(nullif(${providers.name}, ${UNIDENTIFIED_PROVIDER}), ${transactions.name})`;
    const rows = await db
      .select({
        merchant,
        categoryId: transactions.categoryId,
        totalCents: sql<number>`-sum(${transactions.amountCents})`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
      .leftJoin(providers, eq(providers.id, merchantPatterns.providerId))
      .where(and(eq(accounts.familyId, familyId), eq(transactions.kind, "standard"), lt(transactions.amountCents, 0), gte(transactions.date, fromDate), lte(transactions.date, toDate)))
      .groupBy(sql`1`, transactions.categoryId);
    return rows;
  }

  async countMonthsWithSpend(familyId: number, fromDate: string, toDate: string): Promise<number> {
    const [row] = await db
      .select({ months: sql<number>`count(distinct to_char(${transactions.date}, 'YYYY-MM'))`.mapWith(Number) })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(and(eq(accounts.familyId, familyId), eq(transactions.kind, "standard"), lt(transactions.amountCents, 0), gte(transactions.date, fromDate), lte(transactions.date, toDate)));
    return row?.months ?? 0;
  }
}
