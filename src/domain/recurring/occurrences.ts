import { resolveDayOfMonthWithinRange } from "@/domain/payPeriod/rules";
import { assignBestMatches, scoreRecurringMatch, storedMatchScore, type RecurringMatchSignals, type TransactionMatchInput } from "./matching";
import type { OccurrenceMatchSource, RecurringOccurrenceStatus, RecurringStatus } from "./rules";

export interface RecurringItemForOccurrences extends RecurringMatchSignals {
  id: number;
  status: RecurringStatus;
}

export interface TransactionForOccurrences extends TransactionMatchInput {
  id: number;
}

export interface StoredOccurrence {
  id: number;
  recurringItemId: number;
  expectedDate: string;
  expectedAmountCents: number;
  status: RecurringOccurrenceStatus;
  transactionId: number | null;
  matchSource: OccurrenceMatchSource | null;
}

export interface OccurrenceToCreate {
  recurringItemId: number;
  expectedDate: string;
  expectedAmountCents: number;
  status: RecurringOccurrenceStatus;
  transactionId: number | null;
  matchSource: OccurrenceMatchSource | null;
  matchScore: number | null;
}

export interface OccurrenceLink {
  occurrenceId: number;
  transactionId: number;
  matchScore: number;
}

export interface OccurrenceSyncPlan {
  toCreate: OccurrenceToCreate[];
  toLink: OccurrenceLink[];
  toUnlink: number[];
  toDelete: number[];
  toRefreshAmount: Array<{ occurrenceId: number; expectedAmountCents: number }>;
}

export interface OccurrenceSyncInput {
  items: RecurringItemForOccurrences[];
  existing: StoredOccurrence[];
  transactions: TransactionForOccurrences[];
  periodStart: string;
  periodEnd: string;
}

const keyOf = (recurringItemId: number, expectedDate: string) => `${recurringItemId}|${expectedDate}`;

export function planOccurrenceSync(input: OccurrenceSyncInput): OccurrenceSyncPlan {
  const existingByKey = new Map(input.existing.map((o) => [keyOf(o.recurringItemId, o.expectedDate), o]));
  const transactionIds = new Set(input.transactions.map((t) => t.id));

  const toUnlink = input.existing
    .filter((o) => o.status === "paid" && o.matchSource === "auto" && (o.transactionId == null || !transactionIds.has(o.transactionId)))
    .map((o) => o.id);
  const unlinked = new Set(toUnlink);

  const linkedTransactionIds = new Set(
    input.existing.filter((o) => o.transactionId != null && !unlinked.has(o.id)).map((o) => o.transactionId as number),
  );

  const expected = input.items
    .filter((item) => item.status === "active")
    .map((item) => ({ item, expectedDate: resolveDayOfMonthWithinRange(item.dayOfMonth, input.periodStart, input.periodEnd) }))
    .filter((x): x is { item: RecurringItemForOccurrences; expectedDate: string } => x.expectedDate != null)
    .map((x) => ({ ...x, stored: existingByKey.get(keyOf(x.item.id, x.expectedDate)) ?? null }));

  const open = expected.filter((e) => {
    if (e.stored == null) return true;
    if (unlinked.has(e.stored.id)) return true;
    return e.stored.status === "pending" && e.stored.matchSource !== "manual";
  });

  const available = input.transactions.filter((t) => !linkedTransactionIds.has(t.id));
  const matches = assignBestMatches(open, available, (e, tx) => scoreRecurringMatch(e.item, tx), new Set());

  const toCreate: OccurrenceToCreate[] = [];
  const toLink: OccurrenceLink[] = [];

  for (const e of open) {
    const match = matches.get(e);
    if (e.stored == null) {
      toCreate.push({
        recurringItemId: e.item.id,
        expectedDate: e.expectedDate,
        expectedAmountCents: e.item.estimatedAmountCents,
        status: match ? "paid" : "pending",
        transactionId: match?.tx.id ?? null,
        matchSource: match ? "auto" : null,
        matchScore: match ? storedMatchScore(match.score) : null,
      });
    } else if (match) {
      toLink.push({ occurrenceId: e.stored.id, transactionId: match.tx.id, matchScore: storedMatchScore(match.score) });
    }
  }

  const expectedKeys = new Set(expected.map((e) => keyOf(e.item.id, e.expectedDate)));
  const toDelete = input.existing
    .filter((o) => o.status === "pending" && !unlinked.has(o.id) && !expectedKeys.has(keyOf(o.recurringItemId, o.expectedDate)))
    .map((o) => o.id);

  const toRefreshAmount = expected
    .filter((e) => e.stored != null && e.stored.status === "pending" && e.stored.expectedAmountCents !== e.item.estimatedAmountCents)
    .map((e) => ({ occurrenceId: (e.stored as StoredOccurrence).id, expectedAmountCents: e.item.estimatedAmountCents }));

  return { toCreate, toLink, toUnlink, toDelete, toRefreshAmount };
}

export function isEmptyOccurrenceSyncPlan(plan: OccurrenceSyncPlan): boolean {
  return (
    plan.toCreate.length === 0 &&
    plan.toLink.length === 0 &&
    plan.toUnlink.length === 0 &&
    plan.toDelete.length === 0 &&
    plan.toRefreshAmount.length === 0
  );
}

export const OCCURRENCE_DECISIONS = ["mark_paid", "skip", "reopen"] as const;
export type OccurrenceDecision = (typeof OCCURRENCE_DECISIONS)[number];

export class InvalidOccurrenceDecisionError extends Error {}

export function assertValidOccurrenceDecision(decision: string): asserts decision is OccurrenceDecision {
  if (!OCCURRENCE_DECISIONS.includes(decision as OccurrenceDecision)) {
    throw new InvalidOccurrenceDecisionError(`Decisión inválida sobre la ocurrencia: "${decision}".`);
  }
}

export function occurrenceDecisionOutcome(decision: OccurrenceDecision): { status: RecurringOccurrenceStatus; matchSource: OccurrenceMatchSource } {
  switch (decision) {
    case "mark_paid":
      return { status: "paid", matchSource: "manual" };
    case "skip":
      return { status: "skipped", matchSource: "manual" };
    case "reopen":
      return { status: "pending", matchSource: "manual" };
  }
}
