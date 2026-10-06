import { and, desc, eq, gt, gte, lt, lte, or, sql } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import type { AccountSummary, LedgerOperations, LedgerUnitOfWork, NewTransactionInput, TransactionEditInput, TransactionRecord } from "@/domain/ledger/ports";
import type { TransactionKind } from "@/domain/ledger/rules";
import * as schema from "./schema";
import { accountBalancesDaily, accounts } from "./schema/accounts";
import { categoryMonthlyTotals, incomeExpenseMonthly } from "./schema/aggregates";
import { transactions, transfers } from "./schema/transactions";

type Db = NeonDatabase<typeof schema>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function toTransactionRecord(row: typeof transactions.$inferSelect): TransactionRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    date: row.date,
    amountCents: row.amountCents,
    name: row.name,
    rawDescription: row.rawDescription ?? undefined,
    merchantId: row.merchantId,
    categoryId: row.categoryId,
    conceptId: row.conceptId,
    notes: row.notes,
    kind: row.kind,
    status: row.status,
    source: row.source,
    importId: row.importId,
  };
}

class DrizzleLedgerOperations implements LedgerOperations {
  constructor(private readonly tx: Tx) {}

  async getAccount(accountId: number): Promise<AccountSummary | null> {
    const [row] = await this.tx
      .select({ id: accounts.id, familyId: accounts.familyId, isActive: accounts.isActive })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);
    return row ?? null;
  }

  async getTransaction(id: number): Promise<TransactionRecord | null> {
    const [row] = await this.tx.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return row ? toTransactionRecord(row) : null;
  }

  async updateTransactionRow(id: number, fields: TransactionEditInput): Promise<TransactionRecord> {
    const [row] = await this.tx
      .update(transactions)
      .set({
        accountId: fields.accountId,
        date: fields.date,
        amountCents: fields.amountCents,
        name: fields.name,
        categoryId: fields.categoryId,
        ...(fields.conceptId !== undefined ? { conceptId: fields.conceptId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();
    return toTransactionRecord(row);
  }

  async updateTransactionKind(id: number, kind: TransactionKind): Promise<void> {
    await this.tx.update(transactions).set({ kind, updatedAt: new Date() }).where(eq(transactions.id, id));
  }

  async deleteTransactionRow(id: number): Promise<void> {
    await this.tx.delete(transactions).where(eq(transactions.id, id));
  }

  async insertTransaction(input: NewTransactionInput): Promise<TransactionRecord> {
    const [row] = await this.tx
      .insert(transactions)
      .values({
        accountId: input.accountId,
        date: input.date,
        amountCents: input.amountCents,
        name: input.name,
        rawDescription: input.rawDescription,
        merchantId: input.merchantId ?? null,
        categoryId: input.categoryId ?? null,
        conceptId: input.conceptId ?? null,
        notes: input.notes ?? null,
        kind: input.kind ?? "standard",
        status: input.status ?? "posted",
        source: input.source,
        importId: input.importId ?? null,
      })
      .returning();
    return toTransactionRecord(row);
  }

  async applyAccountBalanceDelta(accountId: number, date: string, deltaCents: number): Promise<void> {
    const [prior] = await this.tx
      .select({ balance: accountBalancesDaily.balanceCents })
      .from(accountBalancesDaily)
      .where(and(eq(accountBalancesDaily.accountId, accountId), lt(accountBalancesDaily.date, date)))
      .orderBy(desc(accountBalancesDaily.date))
      .limit(1);
    const priorBalance = prior?.balance ?? 0;

    await this.tx
      .insert(accountBalancesDaily)
      .values({ accountId, date, balanceCents: priorBalance + deltaCents })
      .onConflictDoUpdate({
        target: [accountBalancesDaily.accountId, accountBalancesDaily.date],
        set: { balanceCents: sql`${accountBalancesDaily.balanceCents} + ${deltaCents}` },
      });

    await this.tx
      .update(accountBalancesDaily)
      .set({ balanceCents: sql`${accountBalancesDaily.balanceCents} + ${deltaCents}` })
      .where(and(eq(accountBalancesDaily.accountId, accountId), gt(accountBalancesDaily.date, date)));
  }

  async applyCategoryMonthlyDelta(familyId: number, categoryId: number, month: string, deltaCents: number): Promise<void> {
    await this.tx
      .insert(categoryMonthlyTotals)
      .values({ familyId, categoryId, month, totalCents: deltaCents })
      .onConflictDoUpdate({
        target: [categoryMonthlyTotals.familyId, categoryMonthlyTotals.categoryId, categoryMonthlyTotals.month],
        set: { totalCents: sql`${categoryMonthlyTotals.totalCents} + ${deltaCents}` },
      });
  }

  async applyIncomeExpenseMonthlyDelta(
    familyId: number,
    month: string,
    incomeDeltaCents: number,
    expenseDeltaCents: number,
  ): Promise<void> {
    await this.tx
      .insert(incomeExpenseMonthly)
      .values({ familyId, month, incomeCents: incomeDeltaCents, expenseCents: expenseDeltaCents })
      .onConflictDoUpdate({
        target: [incomeExpenseMonthly.familyId, incomeExpenseMonthly.month],
        set: {
          incomeCents: sql`${incomeExpenseMonthly.incomeCents} + ${incomeDeltaCents}`,
          expenseCents: sql`${incomeExpenseMonthly.expenseCents} + ${expenseDeltaCents}`,
        },
      });
  }

  async findPossibleDuplicates(
    accountId: number,
    amountCents: number,
    date: string,
    windowDays: number,
  ): Promise<TransactionRecord[]> {
    const rows = await this.tx
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          eq(transactions.amountCents, amountCents),
          gte(transactions.date, sql`(${date}::date - ${windowDays}::int)`),
          lte(transactions.date, sql`(${date}::date + ${windowDays}::int)`),
        ),
      );
    return rows.map(toTransactionRecord);
  }

  async linkTransfer(outflowTransactionId: number, inflowTransactionId: number): Promise<void> {
    await this.tx.insert(transfers).values({ outflowTransactionId, inflowTransactionId, status: "confirmed" });
  }

  async findTransferPartner(transactionId: number): Promise<number | null> {
    const [row] = await this.tx
      .select({ inflow: transfers.inflowTransactionId, outflow: transfers.outflowTransactionId })
      .from(transfers)
      .where(or(eq(transfers.inflowTransactionId, transactionId), eq(transfers.outflowTransactionId, transactionId)))
      .limit(1);
    if (!row) return null;
    return row.inflow === transactionId ? row.outflow : row.inflow;
  }

  async unlinkTransfer(transactionId: number): Promise<void> {
    await this.tx.delete(transfers).where(or(eq(transfers.inflowTransactionId, transactionId), eq(transfers.outflowTransactionId, transactionId)));
  }
}

export class DrizzleLedgerUnitOfWork implements LedgerUnitOfWork {
  constructor(private readonly db: Db) {}

  async run<T>(fn: (ops: LedgerOperations) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => fn(new DrizzleLedgerOperations(tx)));
  }
}
