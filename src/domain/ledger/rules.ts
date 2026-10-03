export const TRANSACTION_KINDS = ["standard", "transfer", "loan_payment", "cc_payment", "adjustment"] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export const TRANSFER_KINDS: readonly TransactionKind[] = ["transfer", "loan_payment", "cc_payment"];

export function affectsAggregateTotals(kind: TransactionKind): boolean {
  return !TRANSFER_KINDS.includes(kind);
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

export function assertValidAmountCents(amountCents: number): void {
  if (!Number.isInteger(amountCents)) {
    throw new InvalidTransactionError("amountCents debe ser un entero (centavos), nunca decimal/float");
  }
  if (amountCents === 0) {
    throw new InvalidTransactionError("amountCents no puede ser 0");
  }
}

export function assertValidIsoDate(isoDate: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new InvalidTransactionError(`fecha inválida: "${isoDate}" (se espera YYYY-MM-DD)`);
  }
}

export const DUPLICATE_MATCH_WINDOW_DAYS = 3;
