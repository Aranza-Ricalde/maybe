import { and, eq, isNull } from "drizzle-orm";
import { LearnTransactionCategoryUseCase } from "@/application/learnTransactionCategory";
import { classifyFlow } from "@/domain/ledger/rules";
import { DrizzleCategoryUsageRepository } from "@/infrastructure/db/categoryUsage";
import { db } from "@/infrastructure/db/client";
import { accounts } from "@/infrastructure/db/schema/accounts";
import { categories, merchantPatterns } from "@/infrastructure/db/schema/classification";
import { families } from "@/infrastructure/db/schema/core";
import { providers } from "@/infrastructure/db/schema/providers";
import { transactions } from "@/infrastructure/db/schema/transactions";

async function main() {
  console.log(`Base: ${process.env.DATABASE_URL?.split("@")[1]?.split("/")[0]}  |  SOLO LECTURA`);
  const [family] = await db.select().from(families).limit(1);
  const learner = new LearnTransactionCategoryUseCase(new DrizzleCategoryUsageRepository());
  const catName = new Map((await db.select().from(categories).where(eq(categories.familyId, family.id))).map((c) => [c.id, c.name]));

  const pending = await db
    .select({ id: transactions.id, name: transactions.name, amountCents: transactions.amountCents, providerId: merchantPatterns.providerId, provider: providers.name })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(merchantPatterns, eq(merchantPatterns.id, transactions.merchantId))
    .leftJoin(providers, eq(providers.id, merchantPatterns.providerId))
    .where(and(eq(accounts.familyId, family.id), eq(transactions.kind, "standard"), isNull(transactions.categoryId)));

  const byProvider = new Map<string, { n: number; target: string; share: number; sample: number; flow: string }>();
  let learnedCount = 0;
  let noProvider = 0;
  for (const tx of pending) {
    if (tx.providerId == null) { noProvider++; continue; }
    const learned = await learner.execute({ familyId: family.id, providerId: tx.providerId, amountCents: tx.amountCents });
    if (!learned) continue;
    learnedCount++;
    const key = `${tx.provider} (${classifyFlow(tx.amountCents)})`;
    const cur = byProvider.get(key);
    if (cur) cur.n++;
    else byProvider.set(key, { n: 1, target: catName.get(learned.categoryId) ?? `#${learned.categoryId}`, share: learned.share, sample: learned.sample, flow: classifyFlow(tx.amountCents) });
  }
  console.log(`\nSin categoría (corrientes): ${pending.length}  |  sin proveedor reconocido: ${noProvider}  |  heredarían categoría: ${learnedCount}`);
  for (const [k, v] of [...byProvider.entries()].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`  ${String(v.n).padStart(3)} × ${k.padEnd(34)} → ${v.target}  (${Math.round(v.share * 100)}% de ${v.sample})`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
