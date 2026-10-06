import { normalizeDescriptionTokens } from "@/domain/merchants/resolver";
import type { DetectionAccount, DetectionTransaction } from "./detectionModel";

export const plain = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const CARD_PAYMENT = /\b(pago\s+(de\s+|a\s+)?(tu\s+|la\s+)?(tdc|tarjeta)|abono\s+(a\s+)?(tu\s+|la\s+)?tarjeta|payment\s+(to|from))\b/;
export const SAVINGS_MOVE = /(\bapartado\b|^ahorro\b|\b(spei|transferencia|deposito|traspaso)\b.*\bahorro\b)/;
export const GENERIC_TRANSFER = /\b(transferencia|transfer|spei|traspaso)\b/;
export const DEBT_WORDS = /\b(deuda|prestamo|finiquito)\b/;
export const SAVINGS_CATEGORY = /^ahorro/;
export const DEBT_CATEGORY = /(prestamo|deuda)/;

export interface Markers {
  cardPayment: boolean;
  savings: boolean;
  generic: boolean;
  debt: boolean;
  any: boolean;
}

export function markersOf(tx: DetectionTransaction): Markers {
  const text = plain(tx.name);
  const category = tx.categoryName ? plain(tx.categoryName) : "";
  const cardPayment = CARD_PAYMENT.test(text);
  const savings = SAVINGS_MOVE.test(text) || SAVINGS_CATEGORY.test(category);
  const generic = GENERIC_TRANSFER.test(text);
  const debt = DEBT_WORDS.test(text) || DEBT_CATEGORY.test(category);
  return { cardPayment, savings, generic, debt, any: cardPayment || savings || generic };
}

export function hasSpecificCategory(tx: DetectionTransaction): boolean {
  if (!tx.categoryName) return false;
  const category = plain(tx.categoryName);
  return !SAVINGS_CATEGORY.test(category) && !DEBT_CATEGORY.test(category);
}

export const WEAK_ACCOUNT_WORDS = new Set(["cuenta", "ahorro", "debito", "credito", "tdc", "mi", "de", "la", "el", "deuda"]);

export function mentionsAccount(tx: DetectionTransaction, other: DetectionAccount): boolean {
  const text = new Set(normalizeDescriptionTokens(tx.name));
  const distinctive = normalizeDescriptionTokens(other.name).filter((t) => t.length >= 2 && !WEAK_ACCOUNT_WORDS.has(t.toLowerCase()));
  return distinctive.some((t) => text.has(t)) || (other.type === "credit_card" && /\btdc\b/.test(plain(tx.name)));
}

export const daysBetween = (a: string, b: string) => Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;
