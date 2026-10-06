import { eq, inArray } from "drizzle-orm";
import { SPENDING_NATURE_LABELS, planNatureDefaults, type SpendingNature } from "@/domain/categories/nature";
import { db } from "@/infrastructure/db/client";
import { categories } from "@/infrastructure/db/schema/classification";
import { families } from "@/infrastructure/db/schema/core";

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
  const all = await db.select().from(categories).where(eq(categories.familyId, family.id));
  const plan = planNatureDefaults(all.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId, nature: c.spendingNature, classification: c.classification })));

  const parentName = new Map(all.map((c) => [c.id, c.name]));
  console.log(`\n${all.length} categorías; ${plan.length} recibirían una naturaleza sugerida:`);
  for (const p of plan) {
    const c = all.find((x) => x.id === p.id);
    console.log(`  ${(c?.parentId ? `${parentName.get(c.parentId)} › ` : "") + p.name}  →  ${SPENDING_NATURE_LABELS[p.nature]}`);
  }
  const unclassified = all.filter((c) => c.classification === "expense" && c.spendingNature == null && !plan.some((p) => p.id === c.id));
  console.log(`\nQuedarían sin clasificar (tú decides en Configuración): ${unclassified.map((c) => c.name).join(", ") || "—"}`);

  if (!APPLY) return console.log("\nENSAYO: no se escribió nada. Para aplicar: --apply --confirm-host=<parte del host>.");
  if (plan.length === 0) return console.log("\nNada que aplicar.");

  await db.transaction(async (tx) => {
    for (const nature of ["essential", "discretionary"] as SpendingNature[]) {
      const ids = plan.filter((p) => p.nature === nature).map((p) => p.id);
      if (ids.length > 0) await tx.update(categories).set({ spendingNature: nature }).where(inArray(categories.id, ids));
    }
  });
  console.log(`\nAplicado: ${plan.length} categoría(s) con naturaleza sugerida.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
