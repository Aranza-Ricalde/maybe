import { PERIOD_START_DAY } from "@/domain/payPeriod/rules";
import { FLOWS, classifyFlow, type Flow } from "@/domain/ledger/rules";

export interface TransactionForDetection {
  accountId: number;
  date: string;
  amountCents: number;
  categoryId: number | null;
  merchantId: number | null;
  name: string;
}

export interface RecurringGroupResult {
  patternSignature: string;
  suggestedName: string;
  accountId: number;
  flow: "income" | "expense";
  suggestedAmountCents: number;
  suggestedCategoryId: number | null;
  dayOfMonth: number;
  occurrences: number;
}

const MIN_OCCURRENCES = 3;
const MIN_DISTINCT_MONTHS = 3;
const DAY_OF_MONTH_TOLERANCE = 5;
const AMOUNT_TOLERANCE_RATIO = 0.1;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function patternSignatureFor(tx: Pick<TransactionForDetection, "merchantId" | "name">): string {
  return tx.merchantId != null ? `merchant:${tx.merchantId}` : `name:${normalizeName(tx.name)}`;
}

export function merchantIdFromPatternSignature(patternSignature: string): number | null {
  const match = /^merchant:(\d+)$/.exec(patternSignature);
  return match ? Number(match[1]) : null;
}

function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function average(values: number[]): number {
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function withinTolerance(value: number, reference: number, ratio: number): boolean {
  if (reference === 0) return value === 0;
  return Math.abs(value - reference) / Math.abs(reference) <= ratio;
}

function dayOfMonthSpreadOk(days: number[]): boolean {
  const base = days[0];
  return days.every((d) => Math.abs(d - base) <= DAY_OF_MONTH_TOLERANCE);
}

export function detectRecurringGroups(transactions: TransactionForDetection[]): RecurringGroupResult[] {
  const groups = new Map<string, TransactionForDetection[]>();
  for (const tx of transactions) {
    const key = patternSignatureFor(tx);
    const bucket = groups.get(key) ?? [];
    bucket.push(tx);
    groups.set(key, bucket);
  }

  const results: RecurringGroupResult[] = [];
  for (const [patternSignature, txs] of groups) {
    const distinctMonths = new Set(txs.map((t) => monthKey(t.date)));
    if (txs.length < MIN_OCCURRENCES || distinctMonths.size < MIN_DISTINCT_MONTHS) continue;

    const amounts = txs.map((t) => t.amountCents);
    const avgAmount = average(amounts);
    if (!amounts.every((a) => withinTolerance(a, avgAmount, AMOUNT_TOLERANCE_RATIO))) continue;

    const days = txs.map((t) => dayOfMonth(t.date));
    if (!dayOfMonthSpreadOk(days)) continue;

    const mostRecent = txs.reduce((latest, t) => (t.date > latest.date ? t : latest));
    results.push({
      patternSignature,
      suggestedName: mostRecent.name,
      accountId: mostRecent.accountId,
      flow: classifyFlow(avgAmount),
      suggestedAmountCents: avgAmount,
      suggestedCategoryId: mostRecent.categoryId,
      dayOfMonth: average(days),
      occurrences: txs.length,
    });
  }
  return results;
}

export class InvalidRecurringItemError extends Error {}

export function assertValidRecurringItemName(name: string): void {
  if (!name.trim()) {
    throw new InvalidRecurringItemError("El nombre del recurrente no puede estar vacío.");
  }
}

export function assertValidEstimatedAmount(estimatedAmount: number): void {
  if (!Number.isFinite(estimatedAmount) || estimatedAmount <= 0) {
    throw new InvalidRecurringItemError("El monto estimado debe ser mayor a 0.");
  }
}

export function assertValidDayOfMonth(dayOfMonth: number): void {
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    throw new InvalidRecurringItemError("El día del mes debe estar entre 1 y 31.");
  }
}

export function assertValidRecurringDay(dayOfMonth: number): void {
  if (dayOfMonth !== PERIOD_START_DAY) assertValidDayOfMonth(dayOfMonth);
}

export function signedEstimatedAmountCents(flow: Flow, magnitudeCents: number): number {
  return flow === "income" ? magnitudeCents : -magnitudeCents;
}

export const RECURRING_STATUSES = ["active", "paused"] as const;
export type RecurringStatus = (typeof RECURRING_STATUSES)[number];

export const RECURRING_CANDIDATE_STATUSES = ["pending", "accepted", "dismissed"] as const;
export type RecurringCandidateStatus = (typeof RECURRING_CANDIDATE_STATUSES)[number];

export const RECURRING_OCCURRENCE_STATUSES = ["pending", "paid", "skipped"] as const;
export type RecurringOccurrenceStatus = (typeof RECURRING_OCCURRENCE_STATUSES)[number];

export const OCCURRENCE_MATCH_SOURCES = ["auto", "manual"] as const;
export type OccurrenceMatchSource = (typeof OCCURRENCE_MATCH_SOURCES)[number];

export function assertValidRecurringFlow(flow: string): asserts flow is Flow {
  if (!FLOWS.includes(flow as Flow)) {
    throw new InvalidRecurringItemError(`Flujo inválido: "${flow}".`);
  }
}

export function assertValidRecurringStatus(status: string): asserts status is RecurringStatus {
  if (!RECURRING_STATUSES.includes(status as RecurringStatus)) {
    throw new InvalidRecurringItemError(`Estado de recurrente inválido: "${status}".`);
  }
}

export function assertValidOccurrenceStatus(status: string): asserts status is RecurringOccurrenceStatus {
  if (!RECURRING_OCCURRENCE_STATUSES.includes(status as RecurringOccurrenceStatus)) {
    throw new InvalidRecurringItemError(`Estado de ocurrencia inválido: "${status}".`);
  }
}

export function assertValidOccurrenceMatchSource(source: string): asserts source is OccurrenceMatchSource {
  if (!OCCURRENCE_MATCH_SOURCES.includes(source as OccurrenceMatchSource)) {
    throw new InvalidRecurringItemError(`Origen de match inválido: "${source}".`);
  }
}
