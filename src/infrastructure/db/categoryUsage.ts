import { and, count, eq, gte, isNotNull, lt } from "drizzle-orm";
import type { CategoryUsageRepository } from "@/domain/categories/ports";
import type { Flow } from "@/domain/ledger/rules";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { merchantPatterns } from "./schema/classification";
import { transactions } from "./schema/transactions";

export class DrizzleCategoryUsageRepository implements CategoryUsageRepository {
  async listUsageByProvider(familyId: number, providerId: number, flow: Flow): Promise<{ categoryId: number; count: number }[]> {
    const rows = await db
      .select({ categoryId: transactions.categoryId, count: count() })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .innerJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
      .where(
        and(
          eq(accounts.familyId, familyId),
          eq(merchantPatterns.providerId, providerId),
          eq(transactions.kind, "standard"),
          isNotNull(transactions.categoryId),
          flow === "income" ? gte(transactions.amountCents, 0) : lt(transactions.amountCents, 0),
        ),
      )
      .groupBy(transactions.categoryId);
    return rows.flatMap((r) => (r.categoryId == null ? [] : [{ categoryId: r.categoryId, count: r.count }]));
  }
}
