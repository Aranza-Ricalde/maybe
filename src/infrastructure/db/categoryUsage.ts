import { and, count, eq, gte, isNotNull, isNull, lt } from "drizzle-orm";
import type { CategoryUsageRepository, KnownProviderCategory, UncategorizedTransaction, UncategorizedTransactionsRepository } from "@/domain/categories/ports";
import { learnCategoryFromUsage } from "@/domain/categories/learning";
import type { Flow } from "@/domain/ledger/rules";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { categories, merchantPatterns } from "./schema/classification";
import { users } from "./schema/core";
import { providers } from "./schema/providers";
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

export class DrizzleUncategorizedTransactionsRepository implements UncategorizedTransactionsRepository {
  async listStandardUncategorized(familyId: number): Promise<UncategorizedTransaction[]> {
    return db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        date: transactions.date,
        amountCents: transactions.amountCents,
        name: transactions.name,
        rawDescription: transactions.rawDescription,
        merchantId: transactions.merchantId,
        providerId: merchantPatterns.providerId,
        providerName: providers.name,
        accountName: accounts.name,
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
      .leftJoin(providers, eq(providers.id, merchantPatterns.providerId))
      .where(and(eq(accounts.familyId, familyId), eq(transactions.kind, "standard"), isNull(transactions.categoryId)))
      .orderBy(transactions.date);
  }

  async listOwnerNames(familyId: number): Promise<string[]> {
    const rows = await db.select({ name: users.name }).from(users).where(eq(users.familyId, familyId));
    return rows.map((r) => r.name);
  }

  async listKnownProviderCategories(familyId: number, flow: Flow): Promise<KnownProviderCategory[]> {
    const rows = await db
      .select({ providerId: providers.id, providerName: providers.name, categoryId: categories.id, categoryName: categories.name, count: count() })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .innerJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
      .innerJoin(providers, eq(providers.id, merchantPatterns.providerId))
      .innerJoin(categories, eq(categories.id, transactions.categoryId))
      .where(and(eq(accounts.familyId, familyId), eq(transactions.kind, "standard"), flow === "income" ? gte(transactions.amountCents, 0) : lt(transactions.amountCents, 0)))
      .groupBy(providers.id, providers.name, categories.id, categories.name);

    const byProvider = new Map<number, typeof rows>();
    for (const row of rows) byProvider.set(row.providerId, [...(byProvider.get(row.providerId) ?? []), row]);
    const known: KnownProviderCategory[] = [];
    for (const group of byProvider.values()) {
      const learned = learnCategoryFromUsage(group.map((r) => ({ categoryId: r.categoryId, count: r.count })));
      const top = learned && group.find((r) => r.categoryId === learned.categoryId);
      if (top) known.push({ providerName: top.providerName, categoryId: top.categoryId, categoryName: top.categoryName, count: learned.sample });
    }
    return known.sort((a, b) => b.count - a.count);
  }
}
