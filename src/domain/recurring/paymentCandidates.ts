
export const PAYMENT_CANDIDATE_WINDOW_DAYS = 15;
export const PAYMENT_CANDIDATE_LIMIT = 6;

export interface PaymentCandidateTarget {
  expectedDate: string;
  expectedAmountCents: number;
  flow: "income" | "expense";
}

export interface PaymentCandidateInput {
  id: number;
  date: string;
  amountCents: number;
}

export type RankedPaymentCandidate<T extends PaymentCandidateInput> = T & { daysApart: number; amountDiffCents: number };

const DAY_MS = 86_400_000;

function daysBetween(a: string, b: string): number {
  return Math.round(Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS);
}

export function rankPaymentCandidates<T extends PaymentCandidateInput>(
  target: PaymentCandidateTarget,
  transactions: T[],
  limit: number = PAYMENT_CANDIDATE_LIMIT,
): RankedPaymentCandidate<T>[] {
  return transactions
    .filter((t) => (target.flow === "income") === t.amountCents > 0)
    .map((t) => ({
      ...t,
      daysApart: daysBetween(t.date, target.expectedDate),
      amountDiffCents: Math.abs(Math.abs(t.amountCents) - Math.abs(target.expectedAmountCents)),
    }))
    .filter((t) => t.daysApart <= PAYMENT_CANDIDATE_WINDOW_DAYS)
    .sort((a, b) => a.amountDiffCents - b.amountDiffCents || a.daysApart - b.daysApart || a.id - b.id)
    .slice(0, limit);
}

export class InvalidOccurrenceLinkError extends Error {}

export function assertOccurrenceCanBeLinked(occurrence: { status: string; transactionId: number | null }): void {
  const open = occurrence.status === "pending" || (occurrence.status === "paid" && occurrence.transactionId == null);
  if (!open) throw new InvalidOccurrenceLinkError("Esta ocurrencia ya está resuelta: deshazla primero si quieres elegir otro movimiento.");
}
