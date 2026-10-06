import { eq } from "drizzle-orm";
import {
  bootstrapFamilyUseCase,
  createAccountUseCase,
  createCategoryUseCase,
  createGoalUseCase,
  createRecurringItemUseCase,
  listPayPeriodsUseCase,
  recordTransactionUseCase,
  recordTransferUseCase,
  setBudgetLineUseCase,
  archiveOrDeleteAccountUseCase,
} from "@/infrastructure/container";
import { db } from "@/infrastructure/db/client";
import { DrizzleConceptsRepository } from "@/infrastructure/db/concepts";
import { DrizzleProvidersRepository } from "@/infrastructure/db/providers";

const providersRepo = new DrizzleProvidersRepository();
const conceptsRepo = new DrizzleConceptsRepository();
import { families } from "@/infrastructure/db/schema/core";
import { accounts } from "@/infrastructure/db/schema/accounts";
import { categories } from "@/infrastructure/db/schema/classification";
import { recurringCandidates, scheduledTransactions } from "@/infrastructure/db/schema/budgeting";
import { conceptMatchSuggestions } from "@/infrastructure/db/schema/matching";
import { findPeriodIndexContaining } from "@/domain/payPeriod/rules";

export const E2E_EMAIL = "e2e@test.local";
export const E2E_PASSWORD = "e2e-test-password-123";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function isoDaysFromNow(n: number): string {
  return isoDaysAgo(-n);
}

async function main() {
  console.log("1) Verificando base limpia...");
  const [existingFamily] = await db.select().from(families).limit(1);
  if (existingFamily) {
    throw new Error(
      `Ya existe una family (id=${existingFamily.id}) en esta base. ¿Seguro que esto es el branch e2e-tests y no la base real? Corre primero scripts/reset-e2e.ts si quieres resembrar.`,
    );
  }

  console.log("2) Creando family + usuario...");
  const user = await bootstrapFamilyUseCase.execute({
    familyName: "E2E Test",
    currency: "MXN",
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    name: "E2E Tester",
  });
  const familyId = user.familyId;
  console.log(`   familyId=${familyId} userId=${user.id}`);

  console.log("3) Generando periodos de pago (quincenas)...");
  const today = new Date().toISOString().slice(0, 10);
  const periods = await listPayPeriodsUseCase.execute(familyId, today);
  const currentIdx = findPeriodIndexContaining(periods, today);
  const currentPeriod = periods[currentIdx];
  console.log(`   ${periods.length} periodos, actual: ${currentPeriod.start}..${currentPeriod.end}`);

  console.log("4) Creando categorías...");
  const cat = async (name: string, classification: "income" | "expense", color: string) => {
    await createCategoryUseCase.execute({ familyId, name, classification, color, icon: "tag" });
    const [row] = await db.select().from(categories).where(eq(categories.name, name));
    return row.id;
  };
  const catServicios = await cat("Servicios", "expense", "#0d7d6f");
  const catVivienda = await cat("Vivienda", "expense", "#2563eb");
  const catAlimentacion = await cat("Alimentación", "expense", "#d97706");
  const catTransporte = await cat("Transporte", "expense", "#7c3aed");
  const catOcio = await cat("Ocio", "expense", "#db2777");
  const catNomina = await cat("Nómina", "income", "#16a34a");
  const catPagoDeuda = await cat("Pago de deuda", "expense", "#64748b");

  console.log("5) Creando cuentas...");
  const acc = async (name: string, type: Parameters<typeof createAccountUseCase.execute>[0]["type"], creditLimitCents?: number) => {
    await createAccountUseCase.execute({ familyId, name, type, creditLimitCents });
    const [row] = await db.select().from(accounts).where(eq(accounts.name, name));
    return row.id;
  };
  const accChecking = await acc("Nu Débito", "checking");
  const accSavings = await acc("Nu Ahorro", "savings");
  const accCreditCard = await acc("Nu TDC", "credit_card", 5_000_000);
  const accLoan = await acc("Préstamo Auto", "loan");
  const accCash = await acc("Efectivo", "cash");

  console.log("6) Creando proveedores...");
  const telmex = await providersRepo.create(familyId, "Telmex");
  const cfe = await providersRepo.create(familyId, "CFE");
  const netflixProvider = await providersRepo.create(familyId, "Netflix");

  console.log("7) Creando recurrentes (el concepto nace de cada recurrente)...");
  await createRecurringItemUseCase.execute({ familyId, name: "Internet Casa", flow: "expense", estimatedAmount: 499, dayOfMonth: 5, categoryId: catServicios, accountId: accChecking });
  await createRecurringItemUseCase.execute({ familyId, name: "Luz", flow: "expense", estimatedAmount: 600, dayOfMonth: 20, categoryId: catVivienda, accountId: accChecking });
  await createRecurringItemUseCase.execute({ familyId, name: "Netflix", flow: "expense", estimatedAmount: 229, dayOfMonth: 10, categoryId: catOcio, accountId: accChecking });

  for (const [conceptName, provider] of [["Internet Casa", telmex], ["Luz", cfe], ["Netflix", netflixProvider]] as const) {
    const concept = await conceptsRepo.findByName(familyId, conceptName);
    if (concept) await conceptsRepo.update({ id: concept.id, name: concept.name, categoryId: concept.categoryId, providerId: provider.id });
  }
  const internetConcept = (await conceptsRepo.findByName(familyId, "Internet Casa"))!;
  const luzConcept = (await conceptsRepo.findByName(familyId, "Luz"))!;
  const netflixConcept = (await conceptsRepo.findByName(familyId, "Netflix"))!;
  console.log("8) Creando presupuestos (uno sobre, uno bajo)...");
  await setBudgetLineUseCase.execute({ familyId, categoryId: catAlimentacion, cadence: "monthly", budgetedAmountCents: 300_000 });
  await setBudgetLineUseCase.execute({ familyId, categoryId: catTransporte, cadence: "monthly", budgetedAmountCents: 200_000 });

  console.log("9) Creando meta de ahorro...");
  await createGoalUseCase.execute({
    familyId,
    name: "Vacaciones",
    targetAmountCents: 2_000_000,
    targetDate: isoDaysFromNow(180),
    accountIds: [accSavings],
  });

  console.log("10) Registrando transacciones históricas (para gráficas de evolución 6m/1y)...");
  for (let m = 6; m >= 1; m--) {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - m);
    d.setUTCDate(1);
    const date = d.toISOString().slice(0, 10);
    await recordTransactionUseCase.execute({
      accountId: accChecking,
      date,
      amountCents: 2_000_000,
      name: "Nómina",
      categoryId: catNomina,
      source: "manual",
    });
    await recordTransactionUseCase.execute({
      accountId: accChecking,
      date,
      amountCents: -150_000,
      name: "Renta",
      categoryId: catVivienda,
      source: "manual",
    });
  }

  console.log("11) Registrando movimientos del periodo actual...");
  const periodMid = currentPeriod.start;

  await recordTransactionUseCase.execute({
    accountId: accChecking,
    date: periodMid,
    amountCents: 2_000_000,
    name: "Nómina",
    categoryId: catNomina,
    source: "manual",
  });

  await recordTransactionUseCase.execute({
    accountId: accChecking,
    date: periodMid,
    amountCents: -49_900,
    name: "PAGO MI TELMEX",
    categoryId: catServicios,
    conceptId: internetConcept.id,
    source: "manual",
  });

  await recordTransactionUseCase.execute({
    accountId: accChecking,
    date: periodMid,
    amountCents: -360_000,
    name: "Supermercado",
    categoryId: catAlimentacion,
    source: "manual",
  });

  await recordTransactionUseCase.execute({
    accountId: accChecking,
    date: periodMid,
    amountCents: -80_000,
    name: "Gasolina",
    categoryId: catTransporte,
    source: "manual",
  });

  await recordTransactionUseCase.execute({
    accountId: accCash,
    date: periodMid,
    amountCents: -15_000,
    name: "Cine",
    categoryId: catOcio,
    source: "manual",
  });

  console.log("12) Registrando transferencia y pago de tarjeta...");
  await recordTransferUseCase.execute({
    kind: "transfer",
    fromAccountId: accChecking,
    toAccountId: accSavings,
    date: periodMid,
    amountCents: 500_000,
    notes: "Ahorro para vacaciones",
  });
  await recordTransferUseCase.execute({
    kind: "cc_payment",
    fromAccountId: accChecking,
    toAccountId: accCreditCard,
    date: periodMid,
    amountCents: 200_000,
    notes: null,
  });
  await recordTransferUseCase.execute({
    kind: "loan_payment",
    fromAccountId: accChecking,
    toAccountId: accLoan,
    date: periodMid,
    amountCents: 300_000,
    notes: null,
  });

  console.log("13) Creando una transacción en tarjeta de crédito (deuda real)...");
  await recordTransactionUseCase.execute({
    accountId: accCreditCard,
    date: periodMid,
    amountCents: -120_000,
    name: "Amazon",
    categoryId: catOcio,
    source: "manual",
  });

  console.log("14) Archivando una cuenta (Efectivo) después de darle actividad...");
  await archiveOrDeleteAccountUseCase.execute(accCash);

  console.log("15) Sembrando candidato de recurrente pendiente (directo, determinista)...");
  await db.insert(recurringCandidates).values({
    familyId,
    patternSignature: "spotify-e2e-seed",
    suggestedName: "Spotify",
    suggestedAmountCents: -12_900,
    suggestedCategoryId: catOcio,
    accountId: accChecking,
    status: "pending",
  });

  console.log("16) Sembrando sugerencia de concepto pendiente (directo, determinista)...");
  const netflixTx = await recordTransactionUseCase.execute({
    accountId: accChecking,
    date: periodMid,
    amountCents: -22_900,
    name: "Netflix.com",
    categoryId: catOcio,
    source: "manual",
  });
  await db.insert(conceptMatchSuggestions).values({
    familyId,
    transactionId: netflixTx.id,
    suggestedConceptId: netflixConcept.id,
    score: 55,
    status: "pending",
  });

  console.log("17) Sembrando un pago programado (para el calendario)...");
  await db.insert(scheduledTransactions).values({
    familyId,
    name: "Pago seguro auto",
    amountCents: -85_000,
    categoryId: catPagoDeuda,
    accountId: accChecking,
    scheduledDate: isoDaysFromNow(5),
    status: "planned",
  });

  console.log("\n=== SEED COMPLETO ===");
  console.log(
    JSON.stringify(
      {
        familyId,
        userId: user.id,
        email: E2E_EMAIL,
        accounts: { accChecking, accSavings, accCreditCard, accLoan, accCash },
        categories: { catServicios, catVivienda, catAlimentacion, catTransporte, catOcio, catNomina, catPagoDeuda },
        concepts: { internetConcept: internetConcept.id, luzConcept: luzConcept.id, netflixConcept: netflixConcept.id },
        currentPeriod,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
