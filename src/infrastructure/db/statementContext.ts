import { and, eq, gte, isNotNull, lte, ne, or } from "drizzle-orm";
import type { ExistingMovement, OtherAccountMovement, ReconciliationContext } from "@/domain/statements/reconcile";
import type { StatementAccount, StatementContextRepository } from "@/domain/statements/ports";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { transactions, transfers } from "./schema/transactions";

export class DrizzleStatementContextRepository implements StatementContextRepository {
  async getAccount(familyId: number, accountId: number): Promise<StatementAccount | null> {
    const [row] = await db
      .select({ id: accounts.id, name: accounts.name, isActive: accounts.isActive })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.familyId, familyId)))
      .limit(1);
    return row ?? null;
  }

  async loadContext(familyId: number, accountId: number, from: string, to: string): Promise<ReconciliationContext> {
    const [existingRows, hashRows, otherRows, linkedRows] = await Promise.all([
      db
        .select({ id: transactions.id, date: transactions.date, postedDate: transactions.postedDate, amountCents: transactions.amountCents, name: transactions.name, rawDescription: transactions.rawDescription, importHash: transactions.importHash, source: transactions.source, categoryId: transactions.categoryId })
        .from(transactions)
        .where(and(eq(transactions.accountId, accountId), gte(transactions.date, from), lte(transactions.date, to))),
      db.select({ importHash: transactions.importHash }).from(transactions).where(and(eq(transactions.accountId, accountId), isNotNull(transactions.importHash))),
      db
        .select({ id: transactions.id, accountName: accounts.name, date: transactions.date, amountCents: transactions.amountCents, kind: transactions.kind })
        .from(transactions)
        .innerJoin(accounts, eq(accounts.id, transactions.accountId))
        .where(and(eq(accounts.familyId, familyId), ne(transactions.accountId, accountId), gte(transactions.date, from), lte(transactions.date, to))),
      db.select({ outflow: transfers.outflowTransactionId, inflow: transfers.inflowTransactionId }).from(transfers).innerJoin(transactions, or(eq(transactions.id, transfers.outflowTransactionId), eq(transactions.id, transfers.inflowTransactionId))).innerJoin(accounts, eq(accounts.id, transactions.accountId)).where(and(eq(accounts.familyId, familyId), gte(transactions.date, from), lte(transactions.date, to))),
    ]);

    const linked = new Set(linkedRows.flatMap((row) => [row.outflow, row.inflow]));
    const existing: ExistingMovement[] = existingRows;
    const otherAccounts: OtherAccountMovement[] = otherRows.map((row) => ({ ...row, linkedTransfer: linked.has(row.id) }));
    return { existing, knownHashes: new Set(hashRows.map((row) => row.importHash as string)), otherAccounts };
  }
}
