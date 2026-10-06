import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { count, eq, inArray } from "drizzle-orm";
import { planProviderMerges } from "@/domain/providers/merge";
import { db } from "@/infrastructure/db/client";
import { merchantPatterns } from "@/infrastructure/db/schema/classification";
import { concepts } from "@/infrastructure/db/schema/concepts";
import { families } from "@/infrastructure/db/schema/core";
import { providers } from "@/infrastructure/db/schema/providers";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const CONFIRM_HOST = args.find((a) => a.startsWith("--confirm-host="))?.split("=")[1];
const host = process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "(desconocido)";

async function main() {
  console.log(`Base: ${host}  |  modo: ${APPLY ? "APLICAR" : "ENSAYO (no escribe nada)"}`);
  if (APPLY && (!CONFIRM_HOST || !host.includes(CONFIRM_HOST))) {
    throw new Error(`--apply exige --confirm-host=<parte del host> que coincida con la base actual (${host}). No se aplicó nada.`);
  }

  const [family] = await db.select().from(families).limit(1);
  const [list, patternCounts, conceptCounts] = await Promise.all([
    db.select({ id: providers.id, name: providers.name }).from(providers).where(eq(providers.familyId, family.id)),
    db.select({ providerId: merchantPatterns.providerId, n: count() }).from(merchantPatterns).groupBy(merchantPatterns.providerId),
    db.select({ providerId: concepts.providerId, n: count() }).from(concepts).groupBy(concepts.providerId),
  ]);
  const patternsOf = new Map(patternCounts.map((r) => [r.providerId, r.n]));
  const conceptsOf = new Map(conceptCounts.map((r) => [r.providerId, r.n]));
  const rows = list.map((r) => ({ ...r, patterns: patternsOf.get(r.id) ?? 0, concepts: conceptsOf.get(r.id) ?? 0 }));
  const plan = planProviderMerges(rows.map((r) => ({ id: r.id, name: r.name, references: r.patterns + r.concepts })));
  const refs = new Map(rows.map((r) => [r.id, { patterns: r.patterns, concepts: r.concepts }]));

  console.log(`\n${rows.length} proveedores; ${plan.length} grupo(s) de duplicados exactos:`);
  for (const g of plan) {
    console.log(`  conservar "${g.keep.name}" (#${g.keep.id})`);
    for (const a of g.absorb) console.log(`     absorber "${a.name}" (#${a.id}): ${refs.get(a.id)?.patterns} patrón(es), ${refs.get(a.id)?.concepts} concepto(s)`);
  }
  if (plan.length === 0) return console.log("Nada que fusionar.");
  if (!APPLY) return console.log("\nENSAYO: no se escribió nada. Para aplicar: --apply --confirm-host=<parte del host>.");

  const absorbedIds = plan.flatMap((g) => g.absorb.map((a) => a.id));
  const backupPath = join(tmpdir(), `fusion-proveedores-respaldo-${Date.now()}.json`);
  writeFileSync(
    backupPath,
    JSON.stringify(
      {
        host,
        providers: rows.filter((r) => absorbedIds.includes(r.id)),
        patterns: await db.select().from(merchantPatterns).where(inArray(merchantPatterns.providerId, absorbedIds)),
        concepts: await db.select().from(concepts).where(inArray(concepts.providerId, absorbedIds)),
      },
      null,
      2,
    ),
  );
  console.log(`\nRespaldo: ${backupPath}`);

  await db.transaction(async (tx) => {
    for (const g of plan) {
      const ids = g.absorb.map((a) => a.id);
      await tx.update(merchantPatterns).set({ providerId: g.keep.id }).where(inArray(merchantPatterns.providerId, ids));
      await tx.update(concepts).set({ providerId: g.keep.id, updatedAt: new Date() }).where(inArray(concepts.providerId, ids));
      await tx.delete(providers).where(inArray(providers.id, ids));
    }
  });
  const left = planProviderMerges(
    (await db.select({ id: providers.id, name: providers.name }).from(providers).where(eq(providers.familyId, family.id))).map((r) => ({ ...r, references: 0 })),
  );
  console.log(left.length === 0 ? "VERIFICADO: ya no quedan duplicados exactos." : `ATENCIÓN: quedan ${left.length} grupo(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
