import { eq, sql } from "drizzle-orm";
import { createRecurringItemUseCase, deleteTransactionUseCase } from "@/infrastructure/container";
import { db } from "@/infrastructure/db/client";
import { transactions } from "@/infrastructure/db/schema/transactions";

const PRODUCTION_HOST_FRAGMENT = "ep-calm-brook";
const FAMILY_ID = 31;
const PAYROLL_ACCOUNT_ID = 47;
const SALARY_CATEGORY_ID = 38;
const DUPLICATE_TRANSACTION_ID = 732;
const PAYROLLS = [
  { name: "Nómina 1ª quincena", amount: 20_400, dayOfMonth: 14 },
  { name: "Nómina 2ª quincena", amount: 20_550, dayOfMonth: 29 },
];

const apply = process.argv.includes("--apply");

async function snapshot(label: string) {
  const [row] = (await db.execute(sql`select (select count(*) from transactions) as movimientos, (select sum(amount_cents) from transactions) as suma_montos, (select count(*) from recurring_items where flow = 'income') as recurrentes_de_ingreso`)).rows;
  console.log(label, JSON.stringify(row));
}

async function main() {
  if (!process.env.DATABASE_URL?.includes(PRODUCTION_HOST_FRAGMENT)) throw new Error("DATABASE_URL no apunta a la base de producción esperada; no se hace nada.");

  const [duplicate] = await db.select().from(transactions).where(eq(transactions.id, DUPLICATE_TRANSACTION_ID));
  const isExpected = duplicate && duplicate.name === "Nómina quincenal" && duplicate.source === "manual" && duplicate.amountCents === 2_053_100 && duplicate.date === "2026-08-28";
  console.log(isExpected ? `Movimiento duplicado encontrado: #${duplicate.id} "${duplicate.name}" (${duplicate.date}, manual, $20,531.00). Se conserva el del banco (CSV, $20,531.01).` : `El movimiento ${DUPLICATE_TRANSACTION_ID} no es el esperado; no se borrará.`);
  PAYROLLS.forEach((p) => console.log(`Recurrente de ingreso a crear: ${p.name}, día ${p.dayOfMonth}, $${p.amount}`));

  if (!apply) {
    console.log("\nSimulación: no se cambió nada. Para aplicar los cambios corre el script con --apply.");
    return;
  }

  await snapshot("ANTES  ");
  if (isExpected) await deleteTransactionUseCase.execute(DUPLICATE_TRANSACTION_ID);
  for (const payroll of PAYROLLS) {
    await createRecurringItemUseCase.execute({ familyId: FAMILY_ID, name: payroll.name, flow: "income", estimatedAmount: payroll.amount, dayOfMonth: payroll.dayOfMonth, categoryId: SALARY_CATEGORY_ID, accountId: PAYROLL_ACCOUNT_ID });
  }
  await snapshot("DESPUÉS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
