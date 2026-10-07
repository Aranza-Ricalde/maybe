import { and, eq, inArray } from "drizzle-orm";
import type { NewImportRecord, StatementImportOperations, StatementImportUnitOfWork } from "@/domain/statements/ports";
import { db } from "./client";
import { DrizzleLedgerOperations } from "./ledger";
import { imports } from "./schema/imports";
import { transactions } from "./schema/transactions";

const IMPORT_LABEL = "Estado de cuenta (PDF)";

class DrizzleStatementImportOperations extends DrizzleLedgerOperations implements StatementImportOperations {
  async existingHashes(accountId: number, hashes: string[]): Promise<string[]> {
    if (hashes.length === 0) return [];
    const rows = await this.tx.select({ importHash: transactions.importHash }).from(transactions).where(and(eq(transactions.accountId, accountId), inArray(transactions.importHash, hashes)));
    return rows.map((row) => row.importHash as string);
  }

  async linkStatementRow(transactionId: number, fields: { importHash: string; importId: number; postedDate: string | null }): Promise<void> {
    await this.tx
      .update(transactions)
      .set({ importHash: fields.importHash, importId: fields.importId, reconciled: true, ...(fields.postedDate ? { postedDate: fields.postedDate } : {}), updatedAt: new Date() })
      .where(eq(transactions.id, transactionId));
  }

  async insertImportRecord(record: NewImportRecord): Promise<number> {
    const [row] = await this.tx
      .insert(imports)
      .values({
        familyId: record.familyId,
        filename: IMPORT_LABEL,
        status: "completed",
        bank: record.bank,
        accountId: record.accountId,
        accountLast4: record.accountLast4,
        periodStart: record.periodStart,
        periodEnd: record.periodEnd,
        transactionCount: record.transactionCount,
        linkedCount: record.linkedCount,
        metadata: record.metadata,
      })
      .returning({ id: imports.id });
    return row.id;
  }
}

export class DrizzleStatementImportUnitOfWork implements StatementImportUnitOfWork {
  async run<T>(fn: (ops: StatementImportOperations) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => fn(new DrizzleStatementImportOperations(tx)));
  }
}
