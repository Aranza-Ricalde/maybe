import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq, inArray, sql } from "drizzle-orm";
import { composeEffectiveBudgets, rollUpBudgetHierarchy, totalBudgetedCents } from "@/domain/budget/rules";
import { DEFAULT_CATEGORY_ICON } from "@/domain/categories/rules";
import { RECOMMENDED_STRUCTURE, planReorganization, type ReorgPlan } from "@/domain/categories/reorganization";
import { updateTransactionUseCase } from "@/infrastructure/container";
import { db } from "@/infrastructure/db/client";
import { budgetCategorySettings, recurringItems } from "@/infrastructure/db/schema/budgeting";
import { categories } from "@/infrastructure/db/schema/classification";
import { concepts } from "@/infrastructure/db/schema/concepts";
import { families } from "@/infrastructure/db/schema/core";
import { payPeriods } from "@/infrastructure/db/schema/payPeriods";
import { transactions } from "@/infrastructure/db/schema/transactions";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const CONFIRM_HOST = args.find((a) => a.startsWith("--confirm-host="))?.split("=")[1];
const host = process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "(desconocido)";
const cents = (n: number) => `$${Math.round(n / 100).toLocaleString("en-US")}`;

async function loadState(familyId: number) {
  const [cats, cons, recurring, settings] = await Promise.all([
    db.select().from(categories).where(eq(categories.familyId, familyId)),
    db.select().from(concepts).where(eq(concepts.familyId, familyId)),
    db.select().from(recurringItems).where(eq(recurringItems.familyId, familyId)),
    db.select().from(budgetCategorySettings).where(eq(budgetCategorySettings.familyId, familyId)),
  ]);
  return { cats, cons, recurring, settings };
}

function budgetOf(
  cats: { id: number; parentId: number | null }[],
  settings: { categoryId: number; cadence: "monthly" | "biweekly"; budgetedAmountCents: number }[],
  recurring: { categoryId: number | null; dayOfMonth: number; estimatedAmountCents: number; flow: "income" | "expense"; status: "active" | "paused" }[],
  period: { start: string; end: string },
) {
  const effective = composeEffectiveBudgets(settings, recurring, [period]);
  const lines = rollUpBudgetHierarchy({
    categories: cats,
    effectiveTargets: new Map(effective.map((b) => [b.categoryId, b.targetCents])),
    manualCategoryIds: new Set(settings.map((s) => s.categoryId)),
    actuals: new Map(),
  });
  return { total: totalBudgetedCents(lines) ?? 0, lines };
}

function describe(plan: ReorgPlan, nameOf: (id: number) => string): string[] {
  return plan.steps.map((s) => {
    switch (s.type) {
      case "create":
        return `crear categoría "${s.name}"${s.parentId != null ? ` bajo "${nameOf(s.parentId)}"` : " (principal)"}`;
      case "rename":
        return `renombrar "${s.from}" → "${s.to}"`;
      case "move":
        return `mover "${s.name}" ${s.fromParentId != null ? `de "${nameOf(s.fromParentId)}" ` : ""}→ ${s.parentId != null ? `bajo "${nameOf(s.parentId)}"` : "categoría principal"}`;
      case "assignConcept":
        return `concepto "${s.conceptName}": "${nameOf(s.fromCategoryId)}" → "${nameOf(s.categoryId)}" (también sus recurrentes y movimientos)`;
    }
  });
}

async function main() {
  console.log(`Base: ${host}  |  modo: ${APPLY ? "APLICAR" : "ENSAYO (no escribe nada)"}`);
  if (APPLY && (!CONFIRM_HOST || !host.includes(CONFIRM_HOST))) {
    throw new Error(`--apply exige --confirm-host=<parte del host> que coincida con la base actual (${host}). No se aplicó nada.`);
  }

  const [family] = await db.select().from(families).limit(1);
  const { cats, cons, recurring, settings } = await loadState(family.id);
  const plan = planReorganization({
    familyId: family.id,
    categories: cats.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId, classification: c.classification, color: c.color })),
    concepts: cons.map((c) => ({ id: c.id, name: c.name, categoryId: c.categoryId })),
    ops: RECOMMENDED_STRUCTURE,
  });
  const nameOf = (id: number) => plan.finalCategories.find((c) => c.id === id)?.name ?? cats.find((c) => c.id === id)?.name ?? `#${id}`;

  console.log(`\nPLAN: ${plan.steps.length} pasos (${plan.alreadyDone.length} ya cumplidos)`);
  describe(plan, nameOf).forEach((l, i) => console.log(`  ${String(i + 1).padStart(2)}. ${l}`));

  const conceptSteps = plan.steps.filter((s): s is Extract<typeof s, { type: "assignConcept" }> => s.type === "assignConcept");
  const conceptIds = conceptSteps.map((s) => s.conceptId);
  const affectedRecurring = recurring.filter((r) => r.conceptId != null && conceptIds.includes(r.conceptId));
  const affectedTx = conceptIds.length ? await db.select().from(transactions).where(inArray(transactions.conceptId, conceptIds)) : [];
  console.log(`\nEFECTO: ${affectedRecurring.length} recurrente(s) cambian de categoría: ${affectedRecurring.map((r) => r.name).join(", ") || "—"}`);
  console.log(`        ${affectedTx.length} movimiento(s) ligados a esos conceptos cambian de categoría (los agregados se mantienen vía el caso de uso)`);
  console.log("        Los demás movimientos conservan su categoría (los de categorías movidas siguen en la misma categoría, ahora bajo su nueva madre).");

  const today = new Date().toISOString().slice(0, 10);
  const [period] = await db.select().from(payPeriods).where(and(eq(payPeriods.familyId, family.id), sql`${payPeriods.start} <= ${today} and ${payPeriods.end} >= ${today}`));
  if (period) {
    const before = budgetOf(cats, settings, recurring, period);
    const categoryOfConcept = new Map(conceptSteps.map((s) => [s.conceptId, s.categoryId]));
    const after = budgetOf(
      plan.finalCategories,
      settings,
      recurring.map((r) => ({ ...r, categoryId: r.conceptId != null && categoryOfConcept.has(r.conceptId) ? (categoryOfConcept.get(r.conceptId) as number) : r.categoryId })),
      period,
    );
    console.log(`\nPRESUPUESTO (periodo ${period.start}..${period.end}): total ${cents(before.total)} → ${cents(after.total)}  (${after.total - before.total >= 0 ? "+" : "−"}${cents(Math.abs(after.total - before.total))})`);
    const names = new Map(plan.finalCategories.map((c) => [c.id, c.name]));
    const root = (lines: typeof before.lines) => new Map(lines.filter((l) => l.parentId == null && l.targetCents > 0).map((l) => [l.categoryId, l.targetCents]));
    const b = root(before.lines), a = root(after.lines);
    for (const id of new Set([...b.keys(), ...a.keys()])) {
      if ((b.get(id) ?? 0) !== (a.get(id) ?? 0)) console.log(`   ${names.get(id)?.padEnd(24)} ${cents(b.get(id) ?? 0).padStart(8)} → ${cents(a.get(id) ?? 0).padStart(8)}`);
    }
  }

  if (!APPLY) {
    console.log("\nENSAYO: no se escribió nada. Para aplicar: --apply --confirm-host=<parte del host>.");
    return;
  }
  if (plan.steps.length === 0) {
    console.log("\nNada que aplicar: la estructura ya es la recomendada.");
    return;
  }

  const backupPath = join(tmpdir(), `reorg-categorias-respaldo-${Date.now()}.json`);
  writeFileSync(
    backupPath,
    JSON.stringify({ host, categories: cats, concepts: cons.filter((c) => conceptIds.includes(c.id)), recurring: affectedRecurring, transactions: affectedTx.map((t) => ({ id: t.id, categoryId: t.categoryId, conceptId: t.conceptId })) }, null, 2),
  );
  console.log(`\nRespaldo del estado anterior: ${backupPath}`);

  const realId = new Map<number, number>();
  const real = (id: number) => (id < 0 ? (realId.get(id) as number) : id);
  await db.transaction(async (tx) => {
    for (const step of plan.steps) {
      if (step.type === "create") {
        const [row] = await tx
          .insert(categories)
          .values({ familyId: family.id, name: step.name, parentId: step.parentId == null ? null : real(step.parentId), classification: step.classification, color: step.color, icon: DEFAULT_CATEGORY_ICON })
          .returning({ id: categories.id });
        realId.set(step.tempId, row.id);
      } else if (step.type === "rename") {
        await tx.update(categories).set({ name: step.to }).where(eq(categories.id, step.id));
      } else if (step.type === "move") {
        await tx.update(categories).set({ parentId: step.parentId == null ? null : real(step.parentId) }).where(eq(categories.id, step.id));
      } else {
        const categoryId = real(step.categoryId);
        await tx.update(concepts).set({ categoryId, updatedAt: new Date() }).where(eq(concepts.id, step.conceptId));
        await tx.update(recurringItems).set({ categoryId, updatedAt: new Date() }).where(eq(recurringItems.conceptId, step.conceptId));
      }
    }
  });
  console.log(`Estructura aplicada (${plan.steps.length} pasos, en una sola transacción).`);

  let moved = 0;
  for (const step of conceptSteps) {
    const categoryId = real(step.categoryId);
    for (const t of affectedTx.filter((x) => x.conceptId === step.conceptId && x.categoryId !== categoryId)) {
      await updateTransactionUseCase.execute({ id: t.id, accountId: t.accountId, date: t.date, amountCents: t.amountCents, name: t.name, categoryId, conceptId: t.conceptId });
      moved++;
    }
  }
  console.log(`${moved} movimiento(s) recategorizados.`);

  const after = await loadState(family.id);
  const verify = planReorganization({
    familyId: family.id,
    categories: after.cats.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId, classification: c.classification, color: c.color })),
    concepts: after.cons.map((c) => ({ id: c.id, name: c.name, categoryId: c.categoryId })),
    ops: RECOMMENDED_STRUCTURE,
  });
  console.log(verify.steps.length === 0 ? "VERIFICADO: la estructura quedó como se pidió (el plan ya no tiene pasos pendientes)." : `ATENCIÓN: quedan ${verify.steps.length} pasos sin cumplir.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
