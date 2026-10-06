import { assignBestMatches } from "@/domain/recurring/matching";

export interface CalendarScheduledInput {
  name: string;
  amountCents: number;
  scheduledDate: string;
  status: "planned" | "confirmed" | "cancelled";
  accountId: number | null;
  categoryId: number | null;
}

export interface CalendarTransactionInput {
  id?: number;
  name: string;
  date: string;
  amountCents: number;
  accountId: number;
  categoryId: number | null;
  conceptId: number | null;
  providerId: number | null;
}

export type CalendarEntrySource = "recurrente" | "programado" | "deuda";
export type CalendarEntryStatus = "paid" | "pending" | "overdue" | "skipped";

export interface CalendarOccurrenceInput {
  id: number;
  name: string;
  flow: "income" | "expense";
  expectedDate: string;
  expectedAmountCents: number;
  status: "pending" | "paid" | "skipped";
  matchSource: "auto" | "manual" | null;
  transaction: { id: number; name: string; date: string; amountCents: number } | null;
}

export interface CalendarEntry {
  occurrenceId: number | null;
  name: string;
  flow: "income" | "expense";
  source: CalendarEntrySource;
  expectedDate: string;
  expectedAmountCents: number;
  status: CalendarEntryStatus;
  isManual: boolean;
  actualName: string | null;
  actualDate: string | null;
  actualAmountCents: number | null;
}

function scheduledMatchScore(s: { accountId: number | null; categoryId: number | null }, tx: CalendarTransactionInput): number | null {
  if (s.accountId == null) return null;
  return tx.accountId === s.accountId && tx.categoryId === s.categoryId ? 1 : null;
}

function pendingOrOverdue(expectedDate: string, today: string): CalendarEntryStatus {
  return expectedDate < today ? "overdue" : "pending";
}

function fromOccurrence(o: CalendarOccurrenceInput, today: string): CalendarEntry {
  const status: CalendarEntryStatus = o.status === "paid" ? "paid" : o.status === "skipped" ? "skipped" : pendingOrOverdue(o.expectedDate, today);
  return {
    occurrenceId: o.id,
    name: o.name,
    flow: o.flow,
    source: "recurrente",
    expectedDate: o.expectedDate,
    expectedAmountCents: o.expectedAmountCents,
    status,
    isManual: o.matchSource === "manual",
    actualName: o.transaction?.name ?? null,
    actualDate: o.transaction?.date ?? null,
    actualAmountCents: o.transaction?.amountCents ?? null,
  };
}

export function financialCalendarEntries(
  occurrences: CalendarOccurrenceInput[],
  scheduled: CalendarScheduledInput[],
  periodTransactions: CalendarTransactionInput[],
  today: string,
  periodStart: string,
  periodEnd: string,
): CalendarEntry[] {
  const fromRecurring = occurrences.map((o) => fromOccurrence(o, today));

  const claimedTransactionIds = new Set(occurrences.flatMap((o) => (o.transaction ? [o.transaction.id] : [])));
  const usedTransactions = new Set(periodTransactions.filter((t) => t.id != null && claimedTransactionIds.has(t.id)));

  const scheduledOccurrences = scheduled
    .filter((s) => s.status === "planned" && s.amountCents < 0 && s.scheduledDate >= periodStart && s.scheduledDate <= periodEnd)
    .map((s) => ({ s, expectedDate: s.scheduledDate }));
  const scheduledMatches = assignBestMatches(scheduledOccurrences, periodTransactions, (o, tx) => scheduledMatchScore(o.s, tx), usedTransactions);
  const fromScheduled: CalendarEntry[] = scheduledOccurrences.map((o) => {
    const match = scheduledMatches.get(o)?.tx ?? null;
    return {
      occurrenceId: null,
      name: o.s.name,
      flow: "expense",
      source: "programado",
      expectedDate: o.expectedDate,
      expectedAmountCents: o.s.amountCents,
      status: match ? "paid" : pendingOrOverdue(o.expectedDate, today),
      isManual: false,
      actualName: match?.name ?? null,
      actualDate: match?.date ?? null,
      actualAmountCents: match?.amountCents ?? null,
    };
  });

  return [...fromRecurring, ...fromScheduled].sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
}

export interface GroupedCalendarEntries {
  pending: CalendarEntry[];
  paid: CalendarEntry[];
  skipped: CalendarEntry[];
}

export function groupCalendarEntriesByStatus(entries: CalendarEntry[]): GroupedCalendarEntries {
  const pending = entries
    .filter((e) => e.status === "pending" || e.status === "overdue")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
      return a.expectedDate.localeCompare(b.expectedDate);
    });
  const byDate = (a: CalendarEntry, b: CalendarEntry) => a.expectedDate.localeCompare(b.expectedDate);
  const paid = entries.filter((e) => e.status === "paid").sort(byDate);
  const skipped = entries.filter((e) => e.status === "skipped").sort(byDate);
  return { pending, paid, skipped };
}

export function sortCalendarEntries(entries: CalendarEntry[]): CalendarEntry[] {
  return [...entries].sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
}
