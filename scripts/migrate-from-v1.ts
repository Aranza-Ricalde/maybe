/**
 * Migración única de datos reales de Maybe v1 (Rails/Postgres, extraído por
 * docker exec + COPY, solo lectura — nunca se tocó v1) a Maybe v2.
 *
 * Por default corre en modo DRY RUN: imprime el plan completo (mapeo de
 * cuentas, saldos calculados, conteos) y los verifica contra el `balance`
 * que Rails ya tenía cacheado en v1, sin escribir nada. Solo escribe con
 * --commit, y TODO dentro de una sola transacción de Postgres (todo o nada
 * — si algo falla a la mitad, no queda nada a medias).
 *
 * Uso:
 *   pnpm exec tsx --env-file=.env.local scripts/migrate-from-v1.ts              # dry run
 *   pnpm exec tsx --env-file=.env.local scripts/migrate-from-v1.ts --commit     # escribe de verdad
 */
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import type { AccountType } from "@/domain/accounts/rules";
import { parseCsv } from "@/domain/csvImport/rules";
import { affectsAggregateTotals, classifyFlow, monthStart, type TransactionKind } from "@/domain/ledger/rules";
import { db } from "@/infrastructure/db/client";
import { accountBalancesDaily, accounts } from "@/infrastructure/db/schema/accounts";
import { categoryMonthlyTotals, incomeExpenseMonthly } from "@/infrastructure/db/schema/aggregates";
import { budgetCategorySettings } from "@/infrastructure/db/schema/budgeting";
import { categories } from "@/infrastructure/db/schema/classification";
import { families } from "@/infrastructure/db/schema/core";
import { goalAccounts, goals as goalsTable } from "@/infrastructure/db/schema/goals";
import * as schema from "@/infrastructure/db/schema";
import { transactions, transfers, valuations } from "@/infrastructure/db/schema/transactions";

type DbClient = NeonDatabase<typeof schema>;

const DATA_DIR = `${import.meta.dirname}/migration-data`;
const COMMIT = process.argv.includes("--commit");

const LIABILITY_TYPES = new Set(["credit_card", "loan", "other_liability"]);

function readCsv(file: string) {
  return parseCsv(readFileSync(`${DATA_DIR}/${file}`, "utf8")).rows;
}

function toCents(raw: string): number {
  return Math.round(Number(raw) * 100);
}

function nullable(raw: string | undefined): string | null {
  return raw && raw.length > 0 ? raw : null;
}

function mapAccountType(row: Record<string, string>): AccountType {
  const name = row.name.toLowerCase();
  switch (row.accountable_type) {
    case "CreditCard":
      return "credit_card";
    case "OtherLiability":
      return "other_liability";
    case "Loan":
      return "loan";
    case "Property":
      return "property";
    case "Vehicle":
      return "vehicle";
    case "OtherAsset":
      return "other_asset";
    case "Depository":
      if (/efectivo|cash/.test(name)) return "cash";
      if (row.subtype === "checking") return "checking";
      return "savings"; // subtype "savings" o vacío (las cuentas-meta "Ahorro - X")
    default:
      throw new Error(
        `Tipo de cuenta "${row.accountable_type}" (cuenta "${row.name}") no tiene equivalente en v2 — ` +
          `Investment/Crypto están fuera de alcance del plan. Migración detenida para no perder datos silenciosamente.`,
      );
  }
}

function mapTransactionKind(v1Kind: string, isLinkedTransfer: boolean): TransactionKind {
  if (isLinkedTransfer) {
    if (v1Kind === "cc_payment") return "cc_payment";
    if (v1Kind === "loan_payment") return "loan_payment";
    return "transfer";
  }
  return "standard";
}

/** Todo el trabajo real vive aquí, parametrizado por el cliente de DB — así
 * el modo --commit puede correr esto DENTRO de db.transaction() y el dry
 * run puede correr exactamente la misma lógica de cálculo sin escribir
 * (las llamadas de escritura están guardadas por COMMIT, pero comparten
 * todo el cálculo/verificación con el dry run, para que lo que se valida
 * sea lo mismo que se va a escribir). */
async function runMigration(exec: DbClient, targetFamily: { id: number; currency: string }) {
  const v1Accounts = readCsv("v1_accounts.csv");
  const v1Categories = readCsv("v1_categories.csv");
  const v1Transactions = readCsv("v1_transactions.csv");
  const v1Valuations = readCsv("v1_valuations.csv");
  const v1Transfers = readCsv("v1_transfers.csv");
  const v1Goals = readCsv("v1_goals.csv");
  const v1Budgets = readCsv("v1_budgets.csv");
  const v1BudgetCategories = readCsv("v1_budget_categories.csv");

  console.log("--- Mapeo de cuentas ---");
  const accountTypeById = new Map<string, AccountType>();
  for (const row of v1Accounts) {
    const type = mapAccountType(row);
    accountTypeById.set(row.id, type);
    const flag = LIABILITY_TYPES.has(type) ? " (pasivo — se invierte el signo del saldo)" : "";
    console.log(`  ${row.name.padEnd(28)} ${row.accountable_type}/${row.subtype || "-"} → ${type}${flag}`);
  }
  console.log();

  // ---- Categorías: 2 pasadas (raíz primero, luego hijas con el parent_id ya mapeado) ----
  const categoryIdMap = new Map<string, number>();
  for (const row of v1Categories.filter((r) => !nullable(r.parent_id))) {
    if (COMMIT) {
      const [c] = await exec
        .insert(categories)
        .values({
          familyId: targetFamily.id,
          name: row.name,
          color: row.color,
          icon: row.lucide_icon,
          classification: row.classification as "income" | "expense",
        })
        .returning();
      categoryIdMap.set(row.id, c.id);
    } else {
      categoryIdMap.set(row.id, -1); // placeholder para el cálculo del dry run
    }
  }
  for (const row of v1Categories.filter((r) => nullable(r.parent_id))) {
    if (COMMIT) {
      const parentNewId = categoryIdMap.get(row.parent_id) ?? null;
      const [c] = await exec
        .insert(categories)
        .values({
          familyId: targetFamily.id,
          parentId: parentNewId,
          name: row.name,
          color: row.color,
          icon: row.lucide_icon,
          classification: row.classification as "income" | "expense",
        })
        .returning();
      categoryIdMap.set(row.id, c.id);
    } else {
      categoryIdMap.set(row.id, -1);
    }
  }
  console.log(`Categorías: ${v1Categories.length} (${categoryIdMap.size} mapeadas)\n`);

  // ---- Cuentas ----
  const accountIdMap = new Map<string, number>();
  for (const row of v1Accounts) {
    const type = accountTypeById.get(row.id)!;
    if (COMMIT) {
      const [a] = await exec
        .insert(accounts)
        .values({ familyId: targetFamily.id, name: row.name, type, isActive: row.status === "active" })
        .returning();
      accountIdMap.set(row.id, a.id);
    } else {
      accountIdMap.set(row.id, -1);
    }
  }

  // ---- Eventos (transacciones + valuaciones) en orden cronológico, por cuenta ----
  type Event = { kind: "transaction" | "valuation"; row: Record<string, string> };

  const eventsByAccount = new Map<string, Event[]>();
  for (const row of v1Transactions) {
    const list = eventsByAccount.get(row.account_id) ?? [];
    list.push({ kind: "transaction", row });
    eventsByAccount.set(row.account_id, list);
  }
  for (const row of v1Valuations) {
    const list = eventsByAccount.get(row.account_id) ?? [];
    list.push({ kind: "valuation", row });
    eventsByAccount.set(row.account_id, list);
  }
  for (const list of eventsByAccount.values()) {
    list.sort((a, b) => {
      if (a.row.date !== b.row.date) return a.row.date < b.row.date ? -1 : 1;
      return new Date(a.row.created_at).getTime() - new Date(b.row.created_at).getTime();
    });
  }

  const transferLinkedTxIds = new Set<string>();
  for (const row of v1Transfers) {
    transferLinkedTxIds.add(row.inflow_transaction_id);
    transferLinkedTxIds.add(row.outflow_transaction_id);
  }

  const oldTxIdToNewTxId = new Map<string, number>();
  const balanceSnapshots = new Map<string, number>(); // key "v1AccountId|date" -> running balance
  const categoryMonthlyDelta = new Map<string, number>(); // key "categoryId|month"
  const incomeExpenseDelta = new Map<string, { income: number; expense: number }>(); // key "month"

  console.log("--- Procesando movimientos por cuenta (cronológico) ---");
  let totalTransactions = 0;
  let totalValuations = 0;

  for (const [v1AccountId, events] of eventsByAccount) {
    const accountType = accountTypeById.get(v1AccountId)!;
    const isLiability = LIABILITY_TYPES.has(accountType);
    const newAccountId = accountIdMap.get(v1AccountId)!;
    let runningBalance = 0;

    for (const event of events) {
      if (event.kind === "valuation") {
        const v1Amount = Number(event.row.amount);
        const v2Amount = isLiability ? -v1Amount : v1Amount;
        runningBalance = Math.round(v2Amount * 100);
        totalValuations++;
        if (COMMIT) {
          await exec.insert(valuations).values({
            accountId: newAccountId,
            date: event.row.date,
            balanceCents: runningBalance,
            source: "manual",
          });
        }
      } else {
        const row = event.row;
        const v2AmountCents = -toCents(row.amount); // v1: positivo=gasto, negativo=ingreso — opuesto de v2
        runningBalance += v2AmountCents;
        const isLinked = transferLinkedTxIds.has(row.transaction_id);
        const v2Kind = mapTransactionKind(row.kind, isLinked);
        const categoryNewId = nullable(row.category_id) ? categoryIdMap.get(row.category_id) ?? null : null;

        totalTransactions++;
        if (COMMIT) {
          const [t] = await exec
            .insert(transactions)
            .values({
              accountId: newAccountId,
              date: row.date,
              amountCents: v2AmountCents,
              name: row.name,
              rawDescription: row.name,
              notes: nullable(row.notes),
              categoryId: categoryNewId,
              kind: v2Kind,
              source: "manual",
            })
            .returning();
          oldTxIdToNewTxId.set(row.transaction_id, t.id);
        }

        if (affectsAggregateTotals(v2Kind)) {
          const month = monthStart(row.date);
          if (categoryNewId != null) {
            const key = `${categoryNewId}|${month}`;
            categoryMonthlyDelta.set(key, (categoryMonthlyDelta.get(key) ?? 0) + v2AmountCents);
          }
          const flow = classifyFlow(v2AmountCents);
          const ie = incomeExpenseDelta.get(month) ?? { income: 0, expense: 0 };
          if (flow === "income") ie.income += v2AmountCents;
          else ie.expense += v2AmountCents;
          incomeExpenseDelta.set(month, ie);
        }
      }
      balanceSnapshots.set(`${v1AccountId}|${event.row.date}`, runningBalance);
    }

    const v1Row = v1Accounts.find((a) => a.id === v1AccountId)!;
    const expectedV2Balance = Math.round((isLiability ? -Number(v1Row.balance) : Number(v1Row.balance)) * 100);
    const match = runningBalance === expectedV2Balance ? "✓" : "✗ DESAJUSTE";
    console.log(
      `  ${v1Row.name.padEnd(28)} calculado=${(runningBalance / 100).toFixed(2).padStart(12)}  esperado=${(
        expectedV2Balance / 100
      )
        .toFixed(2)
        .padStart(12)}  ${match}`,
    );
    if (runningBalance !== expectedV2Balance) {
      throw new Error(`Saldo final no coincide para "${v1Row.name}" — me detengo, algo está mal en el mapeo.`);
    }
  }
  console.log(`\nTransacciones: ${totalTransactions} · Valuaciones: ${totalValuations}\n`);

  if (COMMIT) {
    for (const [key, balanceCents] of balanceSnapshots) {
      const [v1AccountId, date] = key.split("|");
      const newAccountId = accountIdMap.get(v1AccountId)!;
      await exec
        .insert(accountBalancesDaily)
        .values({ accountId: newAccountId, date, balanceCents })
        .onConflictDoUpdate({ target: [accountBalancesDaily.accountId, accountBalancesDaily.date], set: { balanceCents } });
    }
    for (const [key, delta] of categoryMonthlyDelta) {
      const [categoryIdStr, month] = key.split("|");
      const categoryId = Number(categoryIdStr);
      await exec
        .insert(categoryMonthlyTotals)
        .values({ familyId: targetFamily.id, categoryId, month, totalCents: delta })
        .onConflictDoUpdate({
          target: [categoryMonthlyTotals.familyId, categoryMonthlyTotals.categoryId, categoryMonthlyTotals.month],
          set: { totalCents: delta },
        });
    }
    for (const [month, ie] of incomeExpenseDelta) {
      await exec
        .insert(incomeExpenseMonthly)
        .values({ familyId: targetFamily.id, month, incomeCents: ie.income, expenseCents: ie.expense })
        .onConflictDoUpdate({
          target: [incomeExpenseMonthly.familyId, incomeExpenseMonthly.month],
          set: { incomeCents: ie.income, expenseCents: ie.expense },
        });
    }
  }

  console.log(`--- Transfers: ${v1Transfers.length} ---`);
  if (COMMIT) {
    for (const row of v1Transfers) {
      const inflowNewId = oldTxIdToNewTxId.get(row.inflow_transaction_id);
      const outflowNewId = oldTxIdToNewTxId.get(row.outflow_transaction_id);
      if (!inflowNewId || !outflowNewId) {
        throw new Error(`Transfer ${row.id}: no encontré las transacciones migradas correspondientes.`);
      }
      await exec.insert(transfers).values({
        inflowTransactionId: inflowNewId,
        outflowTransactionId: outflowNewId,
        status: row.status === "confirmed" ? "confirmed" : "pending",
      });
    }
  }

  console.log(`--- Goals: ${v1Goals.length} ---`);
  if (COMMIT) {
    for (const row of v1Goals) {
      const [goal] = await exec
        .insert(goalsTable)
        .values({
          familyId: targetFamily.id,
          name: row.name,
          targetAmountCents: toCents(row.target_amount),
          targetDate: nullable(row.target_date),
          priority: Number(row.priority),
        })
        .returning();
      // v1 solo permitía una cuenta por meta — v2 soporta varias (ver goal_accounts), esto preserva esa única cuenta.
      const linkedAccountId = nullable(row.account_id) ? (accountIdMap.get(row.account_id) ?? null) : null;
      if (linkedAccountId != null) {
        await exec.insert(goalAccounts).values({ goalId: goal.id, accountId: linkedAccountId });
      }
    }
  }

  console.log(`--- Budgets: ${v1Budgets.length} · Budget categories: ${v1BudgetCategories.length} ---`);
  if (COMMIT) {
    const startDateByOldBudgetId = new Map<string, string>();
    for (const row of v1Budgets) startDateByOldBudgetId.set(row.id, row.start_date);

    const latestByOldCategoryId = new Map<string, { amountCents: number; date: string }>();
    for (const row of v1BudgetCategories) {
      const date = startDateByOldBudgetId.get(row.budget_id);
      if (!date) continue;
      const amountCents = toCents(row.budgeted_spending);
      const existing = latestByOldCategoryId.get(row.category_id);
      if (!existing || date > existing.date) {
        latestByOldCategoryId.set(row.category_id, { amountCents, date });
      }
    }
    for (const [oldCategoryId, { amountCents }] of latestByOldCategoryId) {
      const categoryId = categoryIdMap.get(oldCategoryId);
      if (!categoryId || amountCents <= 0) continue;
      await exec
        .insert(budgetCategorySettings)
        .values({ familyId: targetFamily.id, categoryId, cadence: "monthly", budgetedAmountCents: amountCents })
        .onConflictDoUpdate({
          target: [budgetCategorySettings.familyId, budgetCategorySettings.categoryId],
          set: { budgetedAmountCents: amountCents },
        });
    }
  }
}

async function main() {
  console.log(COMMIT ? "=== MIGRACIÓN REAL (--commit) ===\n" : "=== DRY RUN (sin --commit, no se escribe nada) ===\n");

  const [targetFamily] = await db.select().from(families);
  if (!targetFamily) throw new Error("No hay ninguna family en v2 — corre scripts/bootstrap.ts primero.");

  const existingAccounts = await db.select().from(accounts).where(eq(accounts.familyId, targetFamily.id));
  if (existingAccounts.length > 0) {
    throw new Error(
      `La family ${targetFamily.id} ya tiene ${existingAccounts.length} cuenta(s) — ` +
        `parece que la migración ya corrió. Me detengo para no duplicar datos.`,
    );
  }
  console.log(`Family destino: "${targetFamily.name}" (id ${targetFamily.id}, ${targetFamily.currency})\n`);

  if (COMMIT) {
    await db.transaction(async (tx) => {
      await runMigration(tx as unknown as DbClient, targetFamily);
    });
  } else {
    await runMigration(db, targetFamily);
  }

  console.log(
    COMMIT
      ? "\n✓ MIGRACIÓN COMMITEADA — todo dentro de una sola transacción, todo o nada."
      : "\nDry run completo — todos los saldos calculados coinciden con v1. Corre con --commit para escribir de verdad.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ MIGRACIÓN ABORTADA (nada se escribió, o la transacción se revirtió):", err.message ?? err);
    process.exit(1);
  });
