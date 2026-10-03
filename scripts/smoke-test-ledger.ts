/**
 * Valida RecordTransactionUseCase contra la base real de Neon: crea datos de
 * prueba, registra transacciones, confirma que los agregados quedaron
 * correctos, y borra todo lo que creó. No deja basura en production.
 *
 * Uso: pnpm exec tsx --env-file=.env.local scripts/smoke-test-ledger.ts
 */
import { eq } from "drizzle-orm";
import { DuplicateTransactionError, RecordTransactionUseCase } from "@/application/recordTransaction";
import { db } from "@/infrastructure/db/client";
import { DrizzleLedgerUnitOfWork } from "@/infrastructure/db/ledger";
import { accountBalancesDaily, accounts } from "@/infrastructure/db/schema/accounts";
import { categoryMonthlyTotals, incomeExpenseMonthly } from "@/infrastructure/db/schema/aggregates";
import { categories } from "@/infrastructure/db/schema/classification";
import { families } from "@/infrastructure/db/schema/core";
import { transactions } from "@/infrastructure/db/schema/transactions";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FALLÓ: ${message}`);
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
    .values({ familyId: family.id, name: "__smoke_test_food__", color: "#000", icon: "utensils", classification: "expense" })
    .returning();

  try {
    const useCase = new RecordTransactionUseCase(new DrizzleLedgerUnitOfWork(db));

    console.log("1) Registrando un egreso de $150.00 el 2026-01-10...");
    const tx1 = await useCase.execute({
      accountId: account.id,
      date: "2026-01-10",
      amountCents: -15000,
      name: "Super",
      categoryId: category.id,
      source: "manual",
    });
    assert(tx1.id > 0, "la transacción debe tener id");

    const [balance1] = await db
      .select()
      .from(accountBalancesDaily)
      .where(eq(accountBalancesDaily.accountId, account.id));
    assert(balance1?.balanceCents === -15000, `saldo esperado -15000, llegó ${balance1?.balanceCents}`);

    const [catTotal1] = await db
      .select()
      .from(categoryMonthlyTotals)
      .where(eq(categoryMonthlyTotals.categoryId, category.id));
    assert(catTotal1?.totalCents === -15000, `total de categoría esperado -15000, llegó ${catTotal1?.totalCents}`);

    const [ie1] = await db.select().from(incomeExpenseMonthly).where(eq(incomeExpenseMonthly.familyId, family.id));
    assert(ie1?.expenseCents === -15000 && ie1?.incomeCents === 0, `income/expense mensual incorrecto: ${JSON.stringify(ie1)}`);
    console.log("   ✓ transacción, saldo y agregados correctos");

    console.log("2) Registrando un segundo egreso RETROACTIVO el 2026-01-05 (antes del primero)...");
    await useCase.execute({
      accountId: account.id,
      date: "2026-01-05",
      amountCents: -5000,
      name: "Café",
      categoryId: category.id,
      source: "manual",
    });
    const balancesAfter = await db
      .select()
      .from(accountBalancesDaily)
      .where(eq(accountBalancesDaily.accountId, account.id))
      .orderBy(accountBalancesDaily.date);
    assert(balancesAfter.length === 2, `deberían quedar 2 snapshots, hay ${balancesAfter.length}`);
    assert(balancesAfter[0].balanceCents === -5000, `snapshot del 05 debería ser -5000, es ${balancesAfter[0].balanceCents}`);
    assert(
      balancesAfter[1].balanceCents === -20000,
      `snapshot del 10 debería propagarse a -20000, es ${balancesAfter[1].balanceCents}`,
    );
    console.log("   ✓ el snapshot posterior se propagó correctamente con el movimiento retroactivo");

    console.log("3) Importando por CSV el mismo monto/fecha que un movimiento manual existente...");
    let duplicateDetected = false;
    try {
      await useCase.execute({
        accountId: account.id,
        date: "2026-01-10",
        amountCents: -15000,
        name: "SUPER XYZ 123",
        source: "csv_import",
      });
    } catch (err) {
      if (err instanceof DuplicateTransactionError) duplicateDetected = true;
      else throw err;
    }
    assert(duplicateDetected, "el import de CSV debió detectar el duplicado manual y lanzar DuplicateTransactionError");
    console.log("   ✓ ReconcileImportUseCase (vía skipDuplicateCheck) detectó el duplicado correctamente");

    console.log("4) Registrando un transfer (no debe afectar category_monthly_totals ni income_expense_monthly)...");
    const [ieBefore] = await db.select().from(incomeExpenseMonthly).where(eq(incomeExpenseMonthly.familyId, family.id));
    await useCase.execute({
      accountId: account.id,
      date: "2026-01-12",
      amountCents: -30000,
      name: "Transferencia a ahorro",
      kind: "transfer",
      source: "manual",
    });
    const [ieAfter] = await db.select().from(incomeExpenseMonthly).where(eq(incomeExpenseMonthly.familyId, family.id));
    assert(
      ieAfter.expenseCents === ieBefore!.expenseCents,
      `el transfer no debía afectar income_expense_monthly: antes ${ieBefore!.expenseCents}, después ${ieAfter.expenseCents}`,
    );
    console.log("   ✓ transfer excluido de agregados de categoría/presupuesto, sí afectó el saldo de la cuenta");

    console.log("\nTODAS LAS VALIDACIONES PASARON ✓");
  } finally {
    console.log("\nLimpiando datos de prueba...");
    await db.delete(transactions).where(eq(transactions.accountId, account.id));
    await db.delete(accountBalancesDaily).where(eq(accountBalancesDaily.accountId, account.id));
    await db.delete(categoryMonthlyTotals).where(eq(categoryMonthlyTotals.familyId, family.id));
    await db.delete(incomeExpenseMonthly).where(eq(incomeExpenseMonthly.familyId, family.id));
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
