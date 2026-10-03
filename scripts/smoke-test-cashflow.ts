/**
 * Valida ProjectCashflowUseCase contra la base real de Neon, con una fecha
 * de referencia fija (no la fecha real de hoy) para poder calcular a mano
 * el resultado esperado exacto.
 * Uso: pnpm exec tsx --env-file=.env.local scripts/smoke-test-cashflow.ts
 */
import { eq } from "drizzle-orm";
import { ProjectCashflowUseCase } from "@/application/projectCashflow";
import { db } from "@/infrastructure/db/client";
import { DrizzleCashflowRepository } from "@/infrastructure/db/cashflow";
import { accountBalancesDaily, accounts } from "@/infrastructure/db/schema/accounts";
import { incomeExpenseMonthly } from "@/infrastructure/db/schema/aggregates";
import { recurringItems, scheduledTransactions } from "@/infrastructure/db/schema/budgeting";
import { families } from "@/infrastructure/db/schema/core";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FALLÓ: ${message}`);
}

const AS_OF_DATE = "2026-06-15"; // fija a propósito: junio tiene 30 días, 15 quedan después de esta fecha

async function main() {
  console.log("Creando datos de prueba...");
  const [family] = await db.insert(families).values({ name: "__smoke_test__", currency: "MXN" }).returning();
  const [account] = await db
    .insert(accounts)
    .values({ familyId: family.id, name: "__smoke_test_checking__", type: "checking" })
    .returning();

  try {
    console.log("1) Sembrando saldo actual, recurrentes, programados e historial...");
    await db.insert(accountBalancesDaily).values({ accountId: account.id, date: AS_OF_DATE, balanceCents: 1_000_000 });

    await db.insert(recurringItems).values([
      // ya "pasó" este mes (día 5 < 15) — no debe contar como remanente
      { familyId: family.id, name: "Renta", flow: "expense", estimatedAmountCents: -30000, dayOfMonth: 5, status: "active" },
      // todavía no pasa (día 20 > 15) — sí debe contar
      { familyId: family.id, name: "Netflix", flow: "expense", estimatedAmountCents: -5000, dayOfMonth: 20, status: "active" },
      // todavía no pasa — ingreso
      { familyId: family.id, name: "Nómina", flow: "income", estimatedAmountCents: 200000, dayOfMonth: 25, status: "active" },
      // inactivo — no debe contar para nada
      { familyId: family.id, name: "Gym (cancelado)", flow: "expense", estimatedAmountCents: -9999999, dayOfMonth: 20, status: "paused" },
    ]);

    await db.insert(scheduledTransactions).values([
      // dentro de la ventana (asOfDate, fin de mes] y "planned" — debe contar
      { familyId: family.id, name: "Dentista", amountCents: -10000, scheduledDate: "2026-06-18", status: "planned" },
      // antes de asOfDate — no debe contar
      { familyId: family.id, name: "Ya pasó", amountCents: -999999, scheduledDate: "2026-06-10", status: "planned" },
      // confirmado, no "planned" — no debe contar (ya es una transacción real)
      { familyId: family.id, name: "Ya confirmado", amountCents: -999999, scheduledDate: "2026-06-20", status: "confirmed" },
    ]);

    await db.insert(incomeExpenseMonthly).values([
      { familyId: family.id, month: "2026-03-01", incomeCents: 0, expenseCents: -200000 },
      { familyId: family.id, month: "2026-04-01", incomeCents: 0, expenseCents: -180000 },
      { familyId: family.id, month: "2026-05-01", incomeCents: 0, expenseCents: -220000 },
    ]);

    console.log("2) Corriendo ProjectCashflowUseCase...");
    const useCase = new ProjectCashflowUseCase(new DrizzleCashflowRepository());
    const projection = await useCase.execute(family.id, [account.id], AS_OF_DATE);

    console.log("   ", projection);

    assert(projection.currentBalanceCents === 1_000_000, `saldo actual esperado 1,000,000, llegó ${projection.currentBalanceCents}`);
    assert(
      projection.remainingRecurringCents === 195_000, // -5000 (Netflix) + 200000 (nómina), Renta y Gym excluidos
      `remainingRecurringCents esperado 195000, llegó ${projection.remainingRecurringCents}`,
    );
    assert(
      projection.remainingScheduledCents === -10_000,
      `remainingScheduledCents esperado -10000, llegó ${projection.remainingScheduledCents}`,
    );
    // avg(-200000,-180000,-220000) = -200000; recurrente total de egresos activos = -30000 + -5000 = -35000
    // variable = min(0, -200000 - (-35000)) = -165000; tasa diaria = -165000/30 = -5500; ×15 días restantes = -82500
    assert(
      projection.projectedVariableSpendCents === -82_500,
      `projectedVariableSpendCents esperado -82500, llegó ${projection.projectedVariableSpendCents}`,
    );
    const expectedEndOfMonth = 1_000_000 + 195_000 - 10_000 - 82_500;
    assert(
      projection.projectedEndOfMonthBalanceCents === expectedEndOfMonth,
      `projectedEndOfMonthBalanceCents esperado ${expectedEndOfMonth}, llegó ${projection.projectedEndOfMonthBalanceCents}`,
    );

    console.log("\nTODAS LAS VALIDACIONES PASARON ✓ (proyección a fin de mes: $" + (expectedEndOfMonth / 100).toFixed(2) + ")");
  } finally {
    console.log("\nLimpiando datos de prueba...");
    await db.delete(accountBalancesDaily).where(eq(accountBalancesDaily.accountId, account.id));
    await db.delete(recurringItems).where(eq(recurringItems.familyId, family.id));
    await db.delete(scheduledTransactions).where(eq(scheduledTransactions.familyId, family.id));
    await db.delete(incomeExpenseMonthly).where(eq(incomeExpenseMonthly.familyId, family.id));
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
