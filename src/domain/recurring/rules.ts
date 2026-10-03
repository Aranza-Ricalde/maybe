import { classifyFlow, type Flow } from "@/domain/ledger/rules";

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

export function patternSignatureFor(tx: Pick<TransactionForDetection, "accountId" | "merchantId" | "name">): string {
  const key = tx.merchantId != null ? `merchant:${tx.merchantId}` : `name:${normalizeName(tx.name)}`;
  return `account:${tx.accountId}|${key}`;
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

export function signedEstimatedAmountCents(flow: Flow, magnitudeCents: number): number {
  return flow === "income" ? magnitudeCents : -magnitudeCents;
}
