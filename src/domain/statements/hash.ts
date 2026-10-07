import { normalizeText } from "./text";
import type { ParsedStatementTransaction, StatementBank } from "./types";

const RFC_SUFFIX = /\s*\|\s*rfc:.*$/;
const LEADING_NOISE = [/^spei (?:enviado|recibido)\s*/, /^pago cuenta de tercero\s*/, /^compra\s+/, /^pago a tu tarjeta de credito nu\s*/];
const LONG_NUMBER = /\d{5,}/;
const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "y", "en", "mx", "sa", "cv"]);
const MIN_TOKEN_LENGTH = 3;
const MIN_PREFIX_LENGTH = 4;

export function normalizeDescription(description: string): string {
  let text = normalizeText(description).replace(RFC_SUFFIX, "");
  for (const noise of LEADING_NOISE) text = text.replace(noise, "");
  return text
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !LONG_NUMBER.test(token))
    .join(" ");
}

export function importKeys(bank: StatementBank, accountLast4: string | null, transactions: ParsedStatementTransaction[]): string[] {
  const seen = new Map<string, number>();
  return transactions.map((t) => {
    const base = `${bank}|${accountLast4 ?? "-"}|${t.date}|${t.amountCents}|${normalizeDescription(t.description)}`;
    const occurrence = (seen.get(base) ?? 0) + 1;
    seen.set(base, occurrence);
    return `${base}|${occurrence}`;
  });
}

function tokensOf(description: string): string[] {
  return normalizeDescription(description)
    .split(" ")
    .filter((token) => token.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(token) && !/^\d+$/.test(token));
}

const sameToken = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= MIN_PREFIX_LENGTH && (a.startsWith(b) || b.startsWith(a)));

export function descriptionSimilarity(a: string, b: string): number {
  const left = tokensOf(a);
  const right = tokensOf(b);
  if (left.length === 0 || right.length === 0) return 0;
  const shared = left.filter((token) => right.some((other) => sameToken(token, other))).length;
  return shared / Math.min(left.length, right.length);
}
