import { and, eq } from "drizzle-orm";
import { DetectRecurringItemsUseCase } from "@/application/detectRecurringItems";
import { db } from "@/infrastructure/db/client";
import { DrizzleRecurringCandidateRepository } from "@/infrastructure/db/recurring";
import { accounts } from "@/infrastructure/db/schema/accounts";
import { categories } from "@/infrastructure/db/schema/classification";
import { families } from "@/infrastructure/db/schema/core";
import { recurringCandidates } from "@/infrastructure/db/schema/budgeting";
import { transactions } from "@/infrastructure/db/schema/transactions";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FALLÓ: ${message}`);
}

function monthsAgoOnDay(months: number, day = 5): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  d.setUTCDate(day);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Creando datos de prueba...");
  const [family] = await db.insert(families).values({ name: "__smoke_test__", currency: "MXN" }).returning();
  const [account] = await db
    .insert(accounts)
    .values({ familyId: family.id, name: "__smoke_test_checking__", type: "checking" })
    .returning();
  const [category] = await db
    .insert(categories)
    .values({ familyId: family.id, name: "__smoke_test_streaming__", color: "#000", icon: "tv", classification: "expense" })
    .returning();

  try {
    console.log("1) Sembrando 4 meses de 'Netflix' ~$150 el día 5, + ruido de una sola vez...");
    await db.insert(transactions).values([
      { accountId: account.id, date: monthsAgoOnDay(4, 5), amountCents: -15000, name: "NETFLIX.COM", categoryId: category.id, kind: "standard", source: "manual" },
      { accountId: account.id, date: monthsAgoOnDay(3, 6), amountCents: -15000, name: "NETFLIX.COM", categoryId: category.id, kind: "standard", source: "manual" },
      { accountId: account.id, date: monthsAgoOnDay(2, 4), amountCents: -15500, name: "NETFLIX.COM", categoryId: category.id, kind: "standard", source: "manual" },
      { accountId: account.id, date: monthsAgoOnDay(1, 5), amountCents: -15000, name: "NETFLIX.COM", categoryId: category.id, kind: "standard", source: "manual" },
      { accountId: account.id, date: monthsAgoOnDay(2, 20), amountCents: -120000, name: "MUEBLES DEL NORTE", kind: "standard", source: "manual" },
    ]);

    const useCase = new DetectRecurringItemsUseCase(new DrizzleRecurringCandidateRepository());

    console.log("2) Corriendo DetectRecurringItemsUseCase...");
    const created = await useCase.execute(family.id);
    assert(created.length === 1, `se esperaba 1 candidato nuevo, llegaron ${created.length}`);
    assert(created[0].suggestedAmountCents === -15125, `monto sugerido esperado -15125 (promedio), llegó ${created[0].suggestedAmountCents}`);
    assert(created[0].suggestedCategoryId === category.id, "la categoría sugerida debía ser la de Netflix");
    assert(created[0].status === "pending", "el candidato debe nacer en estado pending");
    console.log(`   ✓ 1 candidato creado: patternSignature="${created[0].patternSignature}", sugerido $${-created[0].suggestedAmountCents / 100}`);

    console.log("3) Corriendo el caso de uso otra vez (no debe duplicar el candidato)...");
    const createdAgain = await useCase.execute(family.id);
    assert(createdAgain.length === 0, `no debía crear candidatos nuevos, creó ${createdAgain.length}`);
    const [rowsForPattern] = await db
      .select()
      .from(recurringCandidates)
      .where(and(eq(recurringCandidates.familyId, family.id), eq(recurringCandidates.patternSignature, created[0].patternSignature)));
    assert(rowsForPattern != null, "el candidato original debe seguir existiendo");
    console.log("   ✓ no se volvió a sugerir el mismo patrón");

    console.log("\nTODAS LAS VALIDACIONES PASARON ✓");
  } finally {
    console.log("\nLimpiando datos de prueba...");
    await db.delete(transactions).where(eq(transactions.accountId, account.id));
    await db.delete(recurringCandidates).where(eq(recurringCandidates.familyId, family.id));
    await db.delete(categories).where(eq(categories.familyId, family.id));
    await db.delete(accounts).where(eq(accounts.familyId, family.id));
    await db.delete(families).where(eq(families.id, family.id));
    console.log("Limpieza completa, no quedó basura en production.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
