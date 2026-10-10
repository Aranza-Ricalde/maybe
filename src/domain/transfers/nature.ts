import { findInstitution, normalizeDescriptionTokens } from "@/domain/merchants/resolver";
import type { SuggestedTransferKind } from "./detectionModel";
import { plain } from "./descriptionMarkers";

export type TransferNature = "internal" | "card" | "debt" | "external" | "unclear";

export interface TransferHint {
  nature: TransferNature;
  kind: SuggestedTransferKind | null;
  reason: string;
}

const LOOKS_LIKE_TRANSFER = /\b(spei|transferencia|transfer|traspaso|cuenta\s+de\s+tercero)\b/;
const THIRD_PARTY = /\bcuenta\s+de\s+tercero\b/;
const CARD_NOTE = /\b(tdc|tarjeta)\b/;
const DEBT_NOTE = /\b(deuda|prestamo|finiquito)\b/;
const COMPENSATION = /\bcompensacion\b/;
const NOTE_SEPARATOR = /\s[–—-]\s/;
const MIN_OWNER_TOKEN = 3;

function splitNote(name: string): { bank: string; note: string } {
  const [bank, ...rest] = name.split(NOTE_SEPARATOR);
  return { bank: plain(bank), note: plain(rest.join(" ")) };
}

export function transferHint(name: string, amountCents: number, ownerNames: string[]): TransferHint | null {
  const { bank, note } = splitNote(name);
  const whole = `${bank} ${note}`;
  if (!LOOKS_LIKE_TRANSFER.test(whole) || COMPENSATION.test(whole)) return null;
  const outflow = amountCents < 0;

  if (outflow && CARD_NOTE.test(note)) return { nature: "card", kind: "cc_payment", reason: "La nota dice que es pago de tarjeta: el gasto ya se contó al comprar con ella" };
  if (outflow && DEBT_NOTE.test(note)) return { nature: "debt", kind: "loan_payment", reason: "La nota dice que es pago de una deuda o préstamo" };

  const ownTokens = new Set(ownerNames.flatMap((n) => normalizeDescriptionTokens(n)).filter((t) => t.length >= MIN_OWNER_TOKEN).map((t) => t.toLowerCase()));
  const bankTokens = normalizeDescriptionTokens(bank).map((t) => t.toLowerCase());
  if (bankTokens.some((t) => ownTokens.has(t))) return { nature: "internal", kind: "transfer", reason: "Lleva tu nombre: parece una transferencia entre tus cuentas" };

  if (THIRD_PARTY.test(bank)) return { nature: "external", kind: null, reason: "Va a la cuenta de otra persona o negocio: cuenta como gasto" };

  const institution = findInstitution(normalizeDescriptionTokens(name));
  if (institution) return { nature: "unclear", kind: null, reason: `Transferencia ${outflow ? "a" : "desde"} ${institution}: ¿es tu propia cuenta o de otra persona?` };
  return { nature: "unclear", kind: null, reason: "Transferencia sin más datos: ¿es entre tus cuentas o con otra persona?" };
}

export const TRANSFER_NATURE_LABELS: Record<TransferNature, string> = {
  internal: "Entre tus cuentas",
  card: "Pago de tarjeta",
  debt: "Pago de deuda",
  external: "A/de otra persona o negocio",
  unclear: "¿Propia u otra persona?",
};
