import { evaluateConceptMatch } from "@/domain/matching/rules";

export interface RecurringMatchSignals {
  flow: "income" | "expense";
  dayOfMonth: number;
  estimatedAmountCents: number;
  conceptId: number | null;
  categoryId: number | null;
  providerId: number | null;
  accountId: number | null;
}

export interface TransactionMatchInput {
  date: string;
  amountCents: number;
  accountId: number;
  categoryId: number | null;
  conceptId: number | null;
  providerId: number | null;
}

export const EXPLICIT_CONCEPT_SCORE = Number.MAX_SAFE_INTEGER;

export function scoreRecurringMatch(r: RecurringMatchSignals, tx: TransactionMatchInput): number | null {
  if ((r.flow === "income") !== tx.amountCents > 0) return null;

  if (tx.conceptId != null) {
    return r.conceptId != null && tx.conceptId === r.conceptId ? EXPLICIT_CONCEPT_SCORE : null;
  }

  const result = evaluateConceptMatch(
    { accountId: tx.accountId, date: tx.date, amountCents: tx.amountCents, categoryId: tx.categoryId, providerId: tx.providerId },
    {
      conceptId: r.conceptId ?? 0,
      categoryId: r.categoryId,
      providerId: r.providerId,
      habitualAccountId: r.accountId,
      expectedAmountCents: r.estimatedAmountCents,
      expectedDayOfMonth: r.dayOfMonth,
    },
  );
  return result.confidence === "strong" ? result.score : null;
}

export function storedMatchScore(score: number): number {
  return Math.min(100, score);
}

function daysApart(a: string, b: string): number {
  return Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;
}

export function assignBestMatches<T extends { expectedDate: string }, X extends { date: string }>(
  items: T[],
  transactions: X[],
  scoreOf: (item: T, tx: X) => number | null,
  usedTransactions: Set<X>,
): Map<T, { tx: X; score: number }> {
  const pairs: Array<{ item: T; tx: X; score: number; distance: number }> = [];
  for (const item of items) {
    for (const tx of transactions) {
      if (usedTransactions.has(tx)) continue;
      const score = scoreOf(item, tx);
      if (score != null) pairs.push({ item, tx, score, distance: daysApart(item.expectedDate, tx.date) });
    }
  }
  pairs.sort((a, b) => b.score - a.score || a.distance - b.distance);

  const assigned = new Map<T, { tx: X; score: number }>();
  for (const { item, tx, score } of pairs) {
    if (assigned.has(item) || usedTransactions.has(tx)) continue;
    assigned.set(item, { tx, score });
    usedTransactions.add(tx);
  }
  return assigned;
}
