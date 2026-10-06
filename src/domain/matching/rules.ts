export const CONCEPT_MATCH_SUGGESTION_STATUSES = ["pending", "confirmed", "rejected"] as const;
export type ConceptMatchSuggestionStatus = (typeof CONCEPT_MATCH_SUGGESTION_STATUSES)[number];

export type MatchConfidence = "strong" | "medium" | "weak" | "none";

export interface ConceptMatchCandidate {
  conceptId: number;
  categoryId: number | null;
  providerId: number | null;
  habitualAccountId: number | null;
  expectedAmountCents: number | null;
  expectedDayOfMonth: number | null;
}

export interface TransactionMatchSignals {
  accountId: number;
  date: string;
  amountCents: number;
  categoryId: number | null;
  providerId: number | null;
}

export interface ConceptMatchResult {
  conceptId: number;
  score: number;
  confidence: MatchConfidence;
}

const PROVIDER_MATCH_POINTS = 50;
const CATEGORY_MATCH_POINTS = 20;
const AMOUNT_MATCH_POINTS = 20;
const DAY_OF_MONTH_MATCH_POINTS = 10;
const HABITUAL_ACCOUNT_MATCH_POINTS = 5;

const AMOUNT_TOLERANCE_RATIO = 0.1;
const DAY_OF_MONTH_TOLERANCE = 5;

const STRONG_SCORE_THRESHOLD = 70;
const MEDIUM_SCORE_THRESHOLD = 40;

function withinAmountTolerance(amountCents: number, expectedCents: number): boolean {
  if (expectedCents === 0) return amountCents === 0;
  return Math.abs(Math.abs(amountCents) - Math.abs(expectedCents)) / Math.abs(expectedCents) <= AMOUNT_TOLERANCE_RATIO;
}

function dayOfMonthOf(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

function withinDayOfMonthTolerance(day: number, expectedDay: number): boolean {
  return Math.abs(day - expectedDay) <= DAY_OF_MONTH_TOLERANCE;
}

function classifyConfidence(score: number, providerMatched: boolean): MatchConfidence {
  if (providerMatched && score >= STRONG_SCORE_THRESHOLD) return "strong";
  if (score >= MEDIUM_SCORE_THRESHOLD) return "medium";
  if (score > 0) return "weak";
  return "none";
}

export function evaluateConceptMatch(tx: TransactionMatchSignals, candidate: ConceptMatchCandidate): ConceptMatchResult {
  const providerMatched = candidate.providerId != null && tx.providerId != null && candidate.providerId === tx.providerId;

  let score = 0;
  if (providerMatched) score += PROVIDER_MATCH_POINTS;
  if (tx.categoryId != null && tx.categoryId === candidate.categoryId) score += CATEGORY_MATCH_POINTS;
  if (candidate.expectedAmountCents != null && withinAmountTolerance(tx.amountCents, candidate.expectedAmountCents)) {
    score += AMOUNT_MATCH_POINTS;
  }
  if (candidate.expectedDayOfMonth != null && withinDayOfMonthTolerance(dayOfMonthOf(tx.date), candidate.expectedDayOfMonth)) {
    score += DAY_OF_MONTH_MATCH_POINTS;
  }
  if (candidate.habitualAccountId != null && candidate.habitualAccountId === tx.accountId) {
    score += HABITUAL_ACCOUNT_MATCH_POINTS;
  }

  return { conceptId: candidate.conceptId, score, confidence: classifyConfidence(score, providerMatched) };
}

export function bestConceptMatch(tx: TransactionMatchSignals, candidates: ConceptMatchCandidate[]): ConceptMatchResult | null {
  let best: ConceptMatchResult | null = null;
  for (const candidate of candidates) {
    const result = evaluateConceptMatch(tx, candidate);
    if (result.confidence === "none") continue;
    if (!best || result.score > best.score) best = result;
  }
  return best;
}
