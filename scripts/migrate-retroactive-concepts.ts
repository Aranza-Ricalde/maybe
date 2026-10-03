/**
 * Migración retroactiva (Fase 1, aprobada por el usuario): resuelve proveedor/concepto
 * para las transacciones y recurring items históricos que existían antes de esta feature.
 *
 * Corre en 3 pasos, cada uno auditable e idempotente:
 *   1) Resuelve merchant/provider para TODAS las transacciones de la familia (usa Gemini solo
 *      para patrones de csv_import que no estén ya cacheados; las manuales no llaman a Gemini).
 *   2) Para cada recurring item sin concepto, busca transacciones reales representativas (mismo
 *      categoryId/accountId, monto y día cercanos) y usa el proveedor YA RESUELTO en el paso 1
 *      (nunca se inventa un proveedor) para crear su Concepto. Si no hay transacciones históricas
 *      que respalden un proveedor, el concepto se crea sin proveedor (providerId null) — queda
 *      disponible para matching por categoría/monto/día, pero nunca podrá alcanzar confianza
 *      "strong" sin proveedor real (regla de oro de principios.md).
 *   3) Vuelve a correr la resolución de concepto sobre todas las transacciones: ahora que existen
 *      conceptos, esta pasada SÍ hace matching real (auto-asigna o crea sugerencias pendientes).
 *      No vuelve a llamar a Gemini (los patrones ya quedaron cacheados en el paso 1).
 *
 * Uso: pnpm exec tsx --env-file=.env.local scripts/migrate-retroactive-concepts.ts
 */
import { and, between, eq, inArray } from "drizzle-orm";
import { CreateConceptUseCase } from "@/application/createConcept";
import { ResolveTransactionConceptUseCase } from "@/application/resolveTransactionConcept";
import { UpdateRecurringItemUseCase } from "@/application/updateRecurringItem";
import { db } from "@/infrastructure/db/client";
import { cleanMerchantNameUseCase } from "@/infrastructure/container";
import { accounts } from "@/infrastructure/db/schema/accounts";
import { recurringItems } from "@/infrastructure/db/schema/budgeting";
import { merchantPatterns } from "@/infrastructure/db/schema/classification";
import { concepts } from "@/infrastructure/db/schema/concepts";
import { conceptMatchSuggestions } from "@/infrastructure/db/schema/matching";
import { transactions } from "@/infrastructure/db/schema/transactions";
import { DrizzleConceptMatchingRepository } from "@/infrastructure/db/matching";
import { DrizzleConceptsRepository } from "@/infrastructure/db/concepts";
import { DrizzleRecurringItemsRepository } from "@/infrastructure/db/recurringItems";

const FAMILY_ID = 31; // "Mi familia" — única familia real en la base (confirmado por lectura previa)

type RecurringItemRow = typeof recurringItems.$inferSelect;

function extractRetryDelayMs(message: string): number | null {
  const match = message.match(/retryDelay"\s*:\s*"(\d+)s"/);
  return match ? Number(match[1]) * 1000 : null;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 8): Promise<T> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === attempts) throw err;
      const message = (err as Error).message;
      const delayMs = extractRetryDelayMs(message) ?? 1000 * 2 ** (attempt - 1);
      console.log(`    (reintentando en ${delayMs}ms tras error: ${message.slice(0, 120)})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs + 500));
    }
  }
  throw new Error("unreachable");
}

/**
 * Busca el proveedor real de un recurring item SOLO a partir de transacciones ya resueltas
 * (nunca lo inventa). Para evitar falsos positivos con etiquetas genéricas de transferencia
 * (ej. "SPEI", que aparece en depósitos/pagos completamente ajenos al concepto), exige que el
 * nombre limpio resuelto coincida con el propio nombre del recurring item — si ninguna
 * transacción cumple eso, se devuelve null (el concepto se crea sin proveedor, honesto).
 */
async function findRepresentativeProviderId(item: RecurringItemRow, accountIds: number[]): Promise<number | null> {
  if (item.categoryId == null || item.estimatedAmountCents == null) return null;

  const tolerance = Math.max(Math.abs(item.estimatedAmountCents) * 0.3, 100);
  const conditions = [
    inArray(transactions.accountId, accountIds),
    eq(transactions.categoryId, item.categoryId),
    between(transactions.amountCents, item.estimatedAmountCents - tolerance, item.estimatedAmountCents + tolerance),
  ];
  if (item.accountId != null) conditions.push(eq(transactions.accountId, item.accountId));

  const rows = await db
    .select({ merchantId: transactions.merchantId })
    .from(transactions)
    .where(and(...conditions))
    .orderBy(transactions.date);

  const itemNameLower = item.name.trim().toLowerCase();
  for (const row of rows) {
    if (row.merchantId == null) continue;
    const [pattern] = await db.select().from(merchantPatterns).where(eq(merchantPatterns.id, row.merchantId));
    if (!pattern?.providerId) continue;
    const cleanNameLower = pattern.cleanName.trim().toLowerCase();
    if (cleanNameLower === itemNameLower || cleanNameLower.includes(itemNameLower) || itemNameLower.includes(cleanNameLower)) {
      return pattern.providerId;
    }
  }
  return null;
}

async function main() {
  const matchingRepo = new DrizzleConceptMatchingRepository();
  const conceptsRepo = new DrizzleConceptsRepository();
  const recurringItemsRepo = new DrizzleRecurringItemsRepository();
  const resolveUseCase = new ResolveTransactionConceptUseCase(cleanMerchantNameUseCase, matchingRepo);
  const createConceptUseCase = new CreateConceptUseCase(conceptsRepo);
  const updateRecurringItemUseCase = new UpdateRecurringItemUseCase(recurringItemsRepo, conceptsRepo);

  const familyAccounts = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.familyId, FAMILY_ID));
  const accountIds = familyAccounts.map((a) => a.id);
  const allTransactions = await db.select({ id: transactions.id }).from(transactions).where(inArray(transactions.accountId, accountIds));

  console.log(`=== PASO 1/3: resolviendo proveedor/merchant para ${allTransactions.length} transacciones ===`);
  let done = 0;
  for (const tx of allTransactions) {
    await withRetry(() => resolveUseCase.execute(tx.id, FAMILY_ID));
    done++;
    if (done % 100 === 0) console.log(`  ...${done}/${allTransactions.length}`);
  }
  console.log(`  ✓ ${done} transacciones procesadas (proveedores resueltos, sin conceptos todavía)`);

  console.log(`\n=== PASO 2/3: creando conceptos para recurring items sin concepto ===`);
  const pendingItems = await db.select().from(recurringItems).where(eq(recurringItems.familyId, FAMILY_ID));
  for (const item of pendingItems) {
    if (item.conceptId != null) {
      console.log(`  - "${item.name}" ya tiene concepto (id=${item.conceptId}), se omite`);
      continue;
    }
    if (item.categoryId == null) {
      console.log(`  - "${item.name}" no tiene categoría, no se puede crear concepto, se omite`);
      continue;
    }

    const providerId = await findRepresentativeProviderId(item, accountIds);
    const concept = await createConceptUseCase.execute({
      familyId: FAMILY_ID,
      name: item.name,
      categoryId: item.categoryId,
      providerId,
      flow: item.flow,
    });

    await updateRecurringItemUseCase.execute({
      id: item.id,
      name: item.name,
      flow: item.flow,
      estimatedAmount: Math.abs(item.estimatedAmountCents) / 100,
      dayOfMonth: item.dayOfMonth,
      categoryId: item.categoryId,
      conceptId: concept.id,
      accountId: item.accountId,
    });

    console.log(`  ✓ "${item.name}" → concepto id=${concept.id}, providerId=${providerId ?? "null (sin evidencia histórica)"}`);
  }

  console.log(`\n=== PASO 3/3: segunda pasada de matching sobre las ${allTransactions.length} transacciones (ya con conceptos reales) ===`);
  done = 0;
  for (const tx of allTransactions) {
    await withRetry(() => resolveUseCase.execute(tx.id, FAMILY_ID));
    done++;
    if (done % 100 === 0) console.log(`  ...${done}/${allTransactions.length}`);
  }

  const finalTxRows = await db.select({ conceptId: transactions.conceptId }).from(transactions).where(inArray(transactions.accountId, accountIds));
  const assignedCount = finalTxRows.filter((r) => r.conceptId != null).length;
  const pendingSuggestions = await db.select().from(conceptMatchSuggestions).where(eq(conceptMatchSuggestions.familyId, FAMILY_ID));
  const conceptsCreated = await db.select().from(concepts).where(eq(concepts.familyId, FAMILY_ID));

  console.log(`\n=== RESUMEN ===`);
  console.log(`Conceptos creados: ${conceptsCreated.length}`);
  console.log(`Transacciones con conceptId asignado automáticamente (match "strong"): ${assignedCount}`);
  console.log(`Sugerencias pendientes de revisión en el dashboard: ${pendingSuggestions.length}`);
  console.log(`Sin ningún match (quedan como antes, sin concepto): ${allTransactions.length - assignedCount - pendingSuggestions.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
