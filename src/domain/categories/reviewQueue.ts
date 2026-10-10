import { classifyFlow, type Flow } from "@/domain/ledger/rules";
import { transferHint, type TransferHint } from "@/domain/transfers/nature";

export const CATEGORY_REVIEW_QUEUE_LIMIT = 300;
const SAMPLE_NAMES = 3;

export class InvalidCategoryReviewError extends Error {}

export const REVIEW_GROUP_MOVEMENTS_LIMIT = 60;

export interface ReviewQueueRow {
  id?: number;
  accountName?: string | null;
  amountCents: number;
  name: string;
  date: string;
  providerId: number | null;
  providerName: string | null;
}

export interface ReviewGroupMovement {
  id: number | null;
  date: string;
  accountName: string | null;
  name: string;
  amountCents: number;
}

export interface CategoryReviewGroup {
  providerId: number;
  providerName: string;
  flow: Flow;
  hintKey: string;
  hint: TransferHint | null;
  count: number;
  totalCents: number;
  sampleNames: string[];
  lastDate: string;
  movements: ReviewGroupMovement[];
}

export const hintKeyOf = (hint: TransferHint | null) => (hint ? `${hint.nature}:${hint.kind ?? "-"}` : "-");

export function reviewGroupOf(row: ReviewQueueRow, ownerNames: string[]) {
  const hint = transferHint(row.name, row.amountCents, ownerNames);
  return { flow: classifyFlow(row.amountCents), hint, hintKey: hintKeyOf(hint) };
}

export function buildCategoryReviewQueue(rows: ReviewQueueRow[], ownerNames: string[] = [], limit = CATEGORY_REVIEW_QUEUE_LIMIT): CategoryReviewGroup[] {
  const groups = new Map<string, CategoryReviewGroup>();
  for (const row of rows) {
    if (row.providerId == null) continue;
    const { flow, hint, hintKey } = reviewGroupOf(row, ownerNames);
    const key = `${row.providerId}:${flow}:${hintKey}`;
    const group = groups.get(key) ?? { providerId: row.providerId, providerName: row.providerName ?? row.name, flow, hintKey, hint, count: 0, totalCents: 0, sampleNames: [], lastDate: row.date, movements: [] };
    group.count++;
    group.totalCents += Math.abs(row.amountCents);
    if (row.date > group.lastDate) group.lastDate = row.date;
    group.movements.push({ id: row.id ?? null, date: row.date, accountName: row.accountName ?? null, name: row.name, amountCents: row.amountCents });
    if (group.sampleNames.length < SAMPLE_NAMES && !group.sampleNames.includes(row.name)) group.sampleNames.push(row.name);
    groups.set(key, group);
  }
  for (const group of groups.values()) group.movements = group.movements.sort((a, b) => b.date.localeCompare(a.date)).slice(0, REVIEW_GROUP_MOVEMENTS_LIMIT);
  return [...groups.values()].sort((a, b) => b.totalCents - a.totalCents || b.count - a.count).slice(0, limit);
}
