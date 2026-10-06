export const TRANSACTION_KINDS = ["standard", "transfer", "loan_payment", "cc_payment", "adjustment"] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export const TRANSACTION_STATUSES = ["posted", "pending"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_SOURCES = ["manual", "csv_import", "telegram", "api"] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

export const VALUATION_SOURCES = ["manual", "csv_import"] as const;
export type ValuationSource = (typeof VALUATION_SOURCES)[number];

export const TRANSFER_KINDS: readonly TransactionKind[] = ["transfer", "loan_payment", "cc_payment"];

export const NON_FLOW_KINDS: readonly TransactionKind[] = [...TRANSFER_KINDS, "adjustment"];

export function affectsAggregateTotals(kind: TransactionKind): boolean {
  return !NON_FLOW_KINDS.includes(kind);
}

export const FLOWS = ["income", "expense"] as const;
export type Flow = (typeof FLOWS)[number];

export function classifyFlow(amountCents: number): Flow {
  return amountCents >= 0 ? "income" : "expense";
}

export function monthStart(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export class InvalidTransactionError extends Error {}

export const MAX_AMOUNT_CENTS = 100_000_000_000;
export const MAX_TRANSACTION_NAME_LENGTH = 200;

export function assertValidAmountCents(amountCents: number): void {
  if (!Number.isInteger(amountCents)) {
    throw new InvalidTransactionError("amountCents debe ser un entero (centavos), nunca decimal/float");
  }
  if (amountCents === 0) {
    throw new InvalidTransactionError("amountCents no puede ser 0");
  }
  if (Math.abs(amountCents) > MAX_AMOUNT_CENTS) {
    throw new InvalidTransactionError("el monto excede el máximo permitido");
  }
}

export function assertValidTransactionName(name: string): void {
  if (!name.trim()) {
    throw new InvalidTransactionError("name no puede estar vacío");
  }
  if (name.length > MAX_TRANSACTION_NAME_LENGTH) {
    throw new InvalidTransactionError(`name no puede pasar de ${MAX_TRANSACTION_NAME_LENGTH} caracteres`);
  }
}

export function assertValidIsoDate(isoDate: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || new Date(`${isoDate}T00:00:00Z`).toISOString().slice(0, 10) !== isoDate) {
    throw new InvalidTransactionError(`fecha inválida: "${isoDate}" (se espera YYYY-MM-DD)`);
  }
}

export const DUPLICATE_MATCH_WINDOW_DAYS = 3;

export function assertValidTransactionKind(kind: string): asserts kind is TransactionKind {
  if (!TRANSACTION_KINDS.includes(kind as TransactionKind)) {
    throw new InvalidTransactionError(`kind inválido: "${kind}"`);
  }
}

export function assertValidTransactionStatus(status: string): asserts status is TransactionStatus {
  if (!TRANSACTION_STATUSES.includes(status as TransactionStatus)) {
    throw new InvalidTransactionError(`status inválido: "${status}"`);
  }
}

export function assertValidTransactionSource(source: string): asserts source is TransactionSource {
  if (!TRANSACTION_SOURCES.includes(source as TransactionSource)) {
    throw new InvalidTransactionError(`source inválido: "${source}"`);
  }
}

export interface TransactionDrilldown {
  categoryId?: number;
  from?: string;
  to?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseTransactionDrilldown(params: { categoryId?: string; from?: string; to?: string }): TransactionDrilldown {
  const categoryId = params.categoryId && /^\d+$/.test(params.categoryId) ? Number(params.categoryId) : undefined;
  const from = params.from && ISO_DATE.test(params.from) ? params.from : undefined;
  const to = params.to && ISO_DATE.test(params.to) ? params.to : undefined;
  const range = from && to && from <= to ? { from, to } : {};
  return { ...(categoryId ? { categoryId } : {}), ...range };
}

export const TRANSACTION_KIND_GROUPS = ["standard", "transfers"] as const;
export type TransactionKindGroup = (typeof TRANSACTION_KIND_GROUPS)[number];

export function parseTransactionKindGroup(value: string | undefined): TransactionKindGroup | undefined {
  return TRANSACTION_KIND_GROUPS.find((g) => g === value);
}
