export const STATEMENT_BANKS = ["nu_debito", "nu_credito", "bbva_debito"] as const;
export type StatementBank = (typeof STATEMENT_BANKS)[number];

export const STATEMENT_BANK_LABELS: Record<StatementBank, string> = {
  nu_debito: "Nu Cuenta (débito)",
  nu_credito: "Tarjeta de Crédito Nu",
  bbva_debito: "BBVA Libretón Básico Cuenta Digital",
};

export const STATEMENT_TRANSACTION_TYPES = ["expense", "income", "internal_transfer", "card_payment"] as const;
export type StatementTransactionType = (typeof STATEMENT_TRANSACTION_TYPES)[number];

export interface PdfWord {
  page: number;
  x0: number;
  x1: number;
  top: number;
  bottom: number;
  text: string;
}

export interface ForeignAmount {
  currency: string;
  amountText: string;
  exchangeRateText: string;
}

export interface ParsedStatementTransaction {
  date: string;
  postedDate?: string;
  description: string;
  amountCents: number;
  type: StatementTransactionType;
  suggestedType?: StatementTransactionType;
  derived?: boolean;
  foreign?: ForeignAmount;
  balanceAfterCents?: number;
}

export interface StatementCheck {
  label: string;
  expected: number;
  actual: number;
  isMoney: boolean;
}

export interface StatementValidation {
  checks: StatementCheck[];
  matches: boolean;
}

export type StatementMetadataValue = string | number;

export interface ParsedStatement {
  bank: StatementBank;
  accountLast4: string | null;
  periodStart: string;
  periodEnd: string;
  openingBalanceCents: number | null;
  closingBalanceCents: number | null;
  transactions: ParsedStatementTransaction[];
  validation: StatementValidation;
  metadata: Record<string, StatementMetadataValue>;
  warnings: string[];
}

export interface StatementParser {
  bank: StatementBank;
  detect(words: PdfWord[]): boolean;
  parse(words: PdfWord[]): ParsedStatement;
}

export class StatementFormatError extends Error {}
export class StatementPasswordError extends Error {}
export class EmptyStatementError extends Error {}

export class BankMismatchError extends Error {
  constructor(public readonly detected: StatementBank) {
    super(`Parece un estado de ${STATEMENT_BANK_LABELS[detected]}.`);
  }
}
export class StatementAccountError extends Error {}
export class StatementTotalsMismatchError extends Error {}
export class StatementAlreadyImportedError extends Error {}
export class InvalidStatementDecisionError extends Error {}
