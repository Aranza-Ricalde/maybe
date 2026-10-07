import { addDays } from "@/domain/payPeriod/rules";
import { descriptionSimilarity } from "./hash";
import type { ParsedStatement, ParsedStatementTransaction, StatementBank, StatementCheck, StatementTransactionType, StatementValidation } from "./types";

export const MATCH_WINDOW_DAYS = 3;
export const PAIR_WINDOW_DAYS = 2;
export const HIGH_CONFIDENCE_SIMILARITY = 0.4;
export const MAX_ELSEWHERE_WARNINGS = 2;

export type PreviewRowStatus = "already_imported" | "probable_match" | "new";
export type MatchConfidence = "high" | "medium" | "low";
export type RowAction = "import" | "link" | "skip";
export type PairKind = "transfer" | "cc_payment";

export interface ExistingMovement {
  id: number;
  date: string;
  postedDate: string | null;
  amountCents: number;
  name: string;
  rawDescription: string | null;
  importHash: string | null;
  source: string;
  categoryId: number | null;
}

export interface OtherAccountMovement {
  id: number;
  accountName: string;
  date: string;
  amountCents: number;
  kind: string;
  linkedTransfer: boolean;
}

export interface ReconciliationContext {
  existing: ExistingMovement[];
  knownHashes: Set<string>;
  otherAccounts: OtherAccountMovement[];
}

export interface RowMatch {
  transactionId: number;
  name: string;
  date: string;
  amountCents: number;
  categoryId: number | null;
  source: string;
  confidence: MatchConfidence;
  dateDistance: number;
  similarity: number;
}

export interface ElsewhereWarning {
  transactionId: number;
  accountName: string;
  date: string;
}

export interface PairSuggestion extends ElsewhereWarning {
  kind: PairKind;
}

export interface PreviewRow {
  index: number;
  hash: string;
  transaction: ParsedStatementTransaction;
  status: PreviewRowStatus;
  match: RowMatch | null;
  selected: boolean;
  defaultAction: RowAction;
  locked: boolean;
  sameAmountElsewhere: ElsewhereWarning[];
  pairSuggestion: PairSuggestion | null;
}

export interface UnmatchedExisting {
  id: number;
  date: string;
  name: string;
  amountCents: number;
  source: string;
}

export interface StatementPreview {
  bank: StatementBank;
  accountLast4: string | null;
  periodStart: string;
  periodEnd: string;
  openingBalanceCents: number | null;
  closingBalanceCents: number | null;
  validation: StatementValidation;
  metadata: ParsedStatement["metadata"];
  warnings: string[];
  rows: PreviewRow[];
  unmatchedExisting: UnmatchedExisting[];
  counts: { new: number; probableMatch: number; alreadyImported: number };
}

const MS_PER_DAY = 86_400_000;
const daysApart = (a: string, b: string) => Math.abs(Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / MS_PER_DAY));

function dateDistance(row: ParsedStatementTransaction, existing: ExistingMovement): number {
  const mine = [row.date, ...(row.postedDate ? [row.postedDate] : [])];
  const theirs = [existing.date, ...(existing.postedDate ? [existing.postedDate] : [])];
  return Math.min(...mine.flatMap((a) => theirs.map((b) => daysApart(a, b))));
}

const similarityTo = (row: ParsedStatementTransaction, existing: ExistingMovement) =>
  Math.max(descriptionSimilarity(row.description, existing.name), existing.rawDescription ? descriptionSimilarity(row.description, existing.rawDescription) : 0);

interface Candidate {
  rowIndex: number;
  existing: ExistingMovement;
  distance: number;
  similarity: number;
  score: number;
}

function confidenceOf(candidate: Candidate, rowAmbiguous: boolean, existingAmbiguous: boolean): MatchConfidence {
  if (candidate.distance === 0 && candidate.similarity >= HIGH_CONFIDENCE_SIMILARITY) return "high";
  if (rowAmbiguous || existingAmbiguous || candidate.distance >= 2) return "low";
  return "medium";
}

function assignMatches(rows: ParsedStatementTransaction[], eligibleRows: Set<number>, existing: ExistingMovement[]): Map<number, RowMatch> {
  const candidates: Candidate[] = [];
  for (const [rowIndex, row] of rows.entries()) {
    if (!eligibleRows.has(rowIndex)) continue;
    for (const e of existing) {
      if (e.importHash != null || e.amountCents !== row.amountCents) continue;
      const distance = dateDistance(row, e);
      if (distance > MATCH_WINDOW_DAYS) continue;
      const similarity = similarityTo(row, e);
      candidates.push({ rowIndex, existing: e, distance, similarity, score: (MATCH_WINDOW_DAYS - distance) * 2 + similarity * 4 });
    }
  }
  const perRow = new Map<number, number>();
  const perExisting = new Map<number, number>();
  for (const c of candidates) {
    perRow.set(c.rowIndex, (perRow.get(c.rowIndex) ?? 0) + 1);
    perExisting.set(c.existing.id, (perExisting.get(c.existing.id) ?? 0) + 1);
  }

  const ordered = [...candidates].sort((a, b) => b.score - a.score || a.distance - b.distance || a.rowIndex - b.rowIndex || a.existing.date.localeCompare(b.existing.date) || a.existing.id - b.existing.id);
  const usedRows = new Set<number>();
  const usedExisting = new Set<number>();
  const matches = new Map<number, RowMatch>();
  for (const c of ordered) {
    if (usedRows.has(c.rowIndex) || usedExisting.has(c.existing.id)) continue;
    usedRows.add(c.rowIndex);
    usedExisting.add(c.existing.id);
    matches.set(c.rowIndex, {
      transactionId: c.existing.id,
      name: c.existing.name,
      date: c.existing.date,
      amountCents: c.existing.amountCents,
      categoryId: c.existing.categoryId,
      source: c.existing.source,
      confidence: confidenceOf(c, (perRow.get(c.rowIndex) ?? 0) > 1, (perExisting.get(c.existing.id) ?? 0) > 1),
      dateDistance: c.distance,
      similarity: c.similarity,
    });
  }
  return matches;
}

const isTransferLike = (row: ParsedStatementTransaction) => row.type === "card_payment" || row.type === "internal_transfer" || row.suggestedType === "internal_transfer";

function pairKindOf(type: StatementTransactionType, suggested?: StatementTransactionType): PairKind {
  return type === "card_payment" || suggested === "card_payment" ? "cc_payment" : "transfer";
}

function elsewhere(row: ParsedStatementTransaction, others: OtherAccountMovement[]): ElsewhereWarning[] {
  return others
    .filter((o) => o.amountCents === row.amountCents && daysApart(o.date, row.date) <= MATCH_WINDOW_DAYS)
    .sort((a, b) => daysApart(a.date, row.date) - daysApart(b.date, row.date))
    .slice(0, MAX_ELSEWHERE_WARNINGS)
    .map((o) => ({ transactionId: o.id, accountName: o.accountName, date: o.date }));
}

function pairFor(row: ParsedStatementTransaction, others: OtherAccountMovement[], taken: Set<number>): PairSuggestion | null {
  if (!isTransferLike(row)) return null;
  const counterpart = others
    .filter((o) => !o.linkedTransfer && !taken.has(o.id) && o.amountCents === -row.amountCents && daysApart(o.date, row.postedDate ?? row.date) <= PAIR_WINDOW_DAYS)
    .sort((a, b) => daysApart(a.date, row.date) - daysApart(b.date, row.date) || a.id - b.id)[0];
  if (!counterpart) return null;
  taken.add(counterpart.id);
  return { transactionId: counterpart.id, accountName: counterpart.accountName, date: counterpart.date, kind: pairKindOf(row.type, row.suggestedType) };
}

export function reconcileStatement(statement: ParsedStatement, hashes: string[], context: ReconciliationContext): StatementPreview {
  const rows = statement.transactions;
  const already = new Set(hashes.map((hash, index) => (context.knownHashes.has(hash) ? index : -1)).filter((index) => index >= 0));
  const eligible = new Set(rows.map((_, index) => index).filter((index) => !already.has(index)));
  const matches = assignMatches(rows, eligible, context.existing);

  const takenCounterparts = new Set<number>();
  const preview: PreviewRow[] = rows.map((transaction, index) => {
    const isAlready = already.has(index);
    const match = matches.get(index) ?? null;
    const status: PreviewRowStatus = isAlready ? "already_imported" : match ? "probable_match" : "new";
    const selected = status === "new" && !transaction.derived;
    return {
      index,
      hash: hashes[index],
      transaction,
      status,
      match,
      selected,
      defaultAction: status === "new" ? (selected ? "import" : "skip") : "skip",
      locked: isAlready,
      sameAmountElsewhere: isAlready ? [] : elsewhere(transaction, context.otherAccounts),
      pairSuggestion: isAlready ? null : pairFor(transaction, context.otherAccounts, takenCounterparts),
    };
  });

  const matchedIds = new Set([...matches.values()].map((m) => m.transactionId));
  const unmatchedExisting = context.existing
    .filter((e) => e.importHash == null && !matchedIds.has(e.id) && e.date >= statement.periodStart && e.date <= statement.periodEnd)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
    .map((e) => ({ id: e.id, date: e.date, name: e.name, amountCents: e.amountCents, source: e.source }));

  return {
    bank: statement.bank,
    accountLast4: statement.accountLast4,
    periodStart: statement.periodStart,
    periodEnd: statement.periodEnd,
    openingBalanceCents: statement.openingBalanceCents,
    closingBalanceCents: statement.closingBalanceCents,
    validation: statement.validation,
    metadata: statement.metadata,
    warnings: statement.warnings,
    rows: preview,
    unmatchedExisting,
    counts: {
      new: preview.filter((r) => r.status === "new").length,
      probableMatch: preview.filter((r) => r.status === "probable_match").length,
      alreadyImported: preview.filter((r) => r.status === "already_imported").length,
    },
  };
}

export const contextWindow = (statement: Pick<ParsedStatement, "periodStart" | "periodEnd">) => ({
  from: addDays(statement.periodStart, -MATCH_WINDOW_DAYS),
  to: addDays(statement.periodEnd, MATCH_WINDOW_DAYS),
});

export type { StatementCheck };
