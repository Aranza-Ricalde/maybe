import type { LedgerOperations } from "@/domain/ledger/ports";
import type { ReconciliationContext } from "./reconcile";
import type { PdfWord, StatementBank } from "./types";

export interface PdfTextExtractor {
  extract(data: Uint8Array, password?: string): Promise<PdfWord[]>;
}

export interface StatementHasher {
  hash(canonicalKey: string): string;
}

export interface StatementAccount {
  id: number;
  name: string;
  isActive: boolean;
}

export interface StatementContextRepository {
  getAccount(familyId: number, accountId: number): Promise<StatementAccount | null>;
  loadContext(familyId: number, accountId: number, from: string, to: string): Promise<ReconciliationContext>;
}

export interface NewImportRecord {
  familyId: number;
  bank: StatementBank;
  accountId: number;
  accountLast4: string | null;
  periodStart: string;
  periodEnd: string;
  transactionCount: number;
  linkedCount: number;
  metadata: Record<string, string | number>;
}

export interface StatementImportOperations extends LedgerOperations {
  existingHashes(accountId: number, hashes: string[]): Promise<string[]>;
  linkStatementRow(transactionId: number, fields: { importHash: string; importId: number; postedDate: string | null }): Promise<void>;
  insertImportRecord(record: NewImportRecord): Promise<number>;
  findImport(importId: number): Promise<{ familyId: number; accountId: number | null } | null>;
  listImportTransactions(importId: number): Promise<Array<{ id: number; source: string }>>;
  unlinkStatementRow(transactionId: number): Promise<void>;
  deleteImportRecord(importId: number): Promise<void>;
}

export interface StatementImportUnitOfWork {
  run<T>(fn: (ops: StatementImportOperations) => Promise<T>): Promise<T>;
}
