import type { TransactionKind } from "./rules";

export type TransactionSource = "manual" | "csv_import" | "telegram";
export type TransactionStatus = "posted" | "pending";

export interface AccountSummary {
  id: number;
  familyId: number;
  isActive: boolean;
}

export interface NewTransactionInput {
  accountId: number;
  date: string;
  amountCents: number;
  name: string;
  rawDescription?: string;
  merchantId?: number | null;
  categoryId?: number | null;
  conceptId?: number | null;
  notes?: string | null;
  kind?: TransactionKind;
  status?: TransactionStatus;
  source: TransactionSource;
  importId?: number | null;
}

export interface TransactionRecord extends NewTransactionInput {
  id: number;
  kind: TransactionKind;
  status: TransactionStatus;
}

export interface TransactionEditInput {
  accountId: number;
  date: string;
  amountCents: number;
  name: string;
  categoryId: number | null;
  conceptId?: number | null;
}

export interface LedgerOperations {
  getAccount(accountId: number): Promise<AccountSummary | null>;
  getTransaction(id: number): Promise<TransactionRecord | null>;
  insertTransaction(input: NewTransactionInput): Promise<TransactionRecord>;
  updateTransactionRow(id: number, fields: TransactionEditInput): Promise<TransactionRecord>;
  deleteTransactionRow(id: number): Promise<void>;
  applyAccountBalanceDelta(accountId: number, date: string, deltaCents: number): Promise<void>;
  applyCategoryMonthlyDelta(familyId: number, categoryId: number, month: string, deltaCents: number): Promise<void>;
  applyIncomeExpenseMonthlyDelta(
    familyId: number,
    month: string,
    incomeDeltaCents: number,
    expenseDeltaCents: number,
  ): Promise<void>;
  findPossibleDuplicates(
    accountId: number,
    amountCents: number,
    date: string,
    windowDays: number,
  ): Promise<TransactionRecord[]>;
  linkTransfer(outflowTransactionId: number, inflowTransactionId: number): Promise<void>;
}

export interface LedgerUnitOfWork {
  run<T>(fn: (ops: LedgerOperations) => Promise<T>): Promise<T>;
}
