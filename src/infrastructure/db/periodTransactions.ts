import { and, eq, gte, lte } from "drizzle-orm";
import { perRequest } from "../requestScope";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { merchantPatterns } from "./schema/classification";
import { transactions } from "./schema/transactions";

export const transactionsBetween = perRequest((familyId: number, fromDateInclusive: string, toDateInclusive: string) =>
  db
    .select({
      id: transactions.id,
      name: transactions.name,
      date: transactions.date,
      amountCents: transactions.amountCents,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      conceptId: transactions.conceptId,
      providerId: merchantPatterns.providerId,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
    .where(and(eq(accounts.familyId, familyId), gte(transactions.date, fromDateInclusive), lte(transactions.date, toDateInclusive))),
);
