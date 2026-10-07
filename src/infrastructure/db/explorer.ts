import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { ExplorerRepository } from "@/domain/explorer/ports";
import type { ExplorerBucket, ExplorerRow } from "@/domain/explorer/rules";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { merchantPatterns } from "./schema/classification";
import { providers } from "./schema/providers";
import { transactions } from "./schema/transactions";

const UNIDENTIFIED_PROVIDER = "Sin identificar";
const BUCKET_UNIT: Record<ExplorerBucket, string> = { day: "day", week: "week", month: "month" };

export class DrizzleExplorerRepository implements ExplorerRepository {
  async aggregate(familyId: number, from: string, to: string, bucket: ExplorerBucket, accountId: number | null): Promise<ExplorerRow[]> {
    const bucketStartSql = sql<string>`to_char(date_trunc(${BUCKET_UNIT[bucket]}, ${transactions.date}), 'YYYY-MM-DD')`;
    const merchant = sql<string | null>`case when ${providers.name} is not null and ${providers.name} <> ${UNIDENTIFIED_PROVIDER} then ${providers.name} else null end`;
    const rows = await db
      .select({
        bucket: bucketStartSql,
        categoryId: transactions.categoryId,
        merchant,
        incomeCents: sql<number>`coalesce(sum(case when ${transactions.amountCents} > 0 then ${transactions.amountCents} else 0 end), 0)`.mapWith(Number),
        expenseCents: sql<number>`coalesce(sum(case when ${transactions.amountCents} < 0 then -${transactions.amountCents} else 0 end), 0)`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
      .leftJoin(providers, eq(providers.id, merchantPatterns.providerId))
      .where(and(eq(accounts.familyId, familyId), eq(transactions.kind, "standard"), gte(transactions.date, from), lte(transactions.date, to), accountId != null ? eq(transactions.accountId, accountId) : undefined))
      .groupBy(sql`1`, transactions.categoryId, sql`3`);
    return rows;
  }
}
