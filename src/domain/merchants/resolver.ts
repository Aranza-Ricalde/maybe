
export const BANK_PREFIX_PHRASES = [
  "DEPOSITO SPEI RECIBIDO",
  "PAGO CUENTA DE TERCERO POR",
  "PAGO CUENTA DE TERCERO",
  "SPEI RECIBIDO",
  "SPEI ENVIADO",
  "SPEI SALIDA",
  "UBR PENDING",
  "D LOCAL",
  "CLIP MX",
  "MERCADOPAGO",
  "MERPAGO",
  "PAYPAL",
  "SP",
  "SQ",
  "COMPRA",
  "DLO",
  "STR",
  "RESTAURANTE",
  "REST",
] as const;

const TRANSFER_MARKERS = ["SPEI", "TRANSFERENCIA", "TRANSFER"];

export const KNOWN_INSTITUTIONS: ReadonlyArray<{ name: string; tokens: string[] }> = [
  { name: "Nu México", tokens: ["NU", "MEXICO"] },
  { name: "Nubank", tokens: ["NUBANK"] },
  { name: "Mercado Pago", tokens: ["MERCADO", "PAGO"] },
  { name: "STP", tokens: ["STP"] },
  { name: "BBVA", tokens: ["BBVA"] },
  { name: "Banamex", tokens: ["BANAMEX"] },
  { name: "Openbank", tokens: ["OPENBANK"] },
  { name: "Santander", tokens: ["SANTANDER"] },
  { name: "HSBC", tokens: ["HSBC"] },
  { name: "Banorte", tokens: ["BANORTE"] },
  { name: "Hey Banco", tokens: ["HEY", "BANCO"] },
  { name: "Klar", tokens: ["KLAR"] },
  { name: "Arcus", tokens: ["ARCUS"] },
];

const STOP_TOKENS = new Set([
  "DE", "DEL", "LA", "LAS", "EL", "LOS", "SA", "CV", "SAPI", "COM", "MX", "MEXICO", "COMPRA", "PAGO", "TDA", "SUC", "SUCURSAL", "PENDING", "REF", "CASH",
]);

export const GENERIC_MERCHANT_TERMS = new Set([
  "RESTAURANTE", "REST", "COMIDA", "CAFE", "CAFETERIA", "RENTA", "AGUA", "LUZ", "CASA", "CINE", "AHORRO", "DEUDA", "GASOLINA",
  "DESPENSA", "FRAPPE", "CAMION", "TRANSPORTE", "SERVICIOS", "TRANSFERENCIA", "DEPOSITO", "ABONO", "PRESTAMO", "GALERIAS", "PLAZA",
  "TIENDA", "SUPER", "FARMACIA", "GYM", "TAXI", "PAN", "PANADERIA", "ROPA", "TACOS", "PIZZA", "HELADO",
]);

export const NOISE_MIN_DISTINCT_MERCHANTS = 4;

const MIN_KNOWN_KEY_LENGTH = 4;

export function normalizeDescriptionTokens(description: string): string[] {
  return description
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\d+/g, " ")
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function merchantKey(name: string): string {
  return normalizeDescriptionTokens(name).join("");
}

function stripBankPrefixes(tokens: string[]): string[] {
  let current = tokens;
  let changed = true;
  while (changed && current.length > 0) {
    changed = false;
    for (const phrase of BANK_PREFIX_PHRASES) {
      const words = phrase.split(" ");
      if (current.length > words.length && words.every((w, i) => current[i] === w)) {
        current = current.slice(words.length);
        changed = true;
        break;
      }
    }
  }
  return current;
}

export interface MerchantHistoryEntry {
  description: string;
  merchantName: string;
}

export function learnNoiseTokens(history: MerchantHistoryEntry[], minDistinct = NOISE_MIN_DISTINCT_MERCHANTS): Set<string> {
  const merchantsByToken = new Map<string, Set<string>>();
  for (const entry of history) {
    const merchant = merchantKey(entry.merchantName);
    const ownNameTokens = new Set(normalizeDescriptionTokens(entry.merchantName));
    for (const token of new Set(stripBankPrefixes(normalizeDescriptionTokens(entry.description)))) {
      if (ownNameTokens.has(token)) continue;
      const set = merchantsByToken.get(token) ?? new Set<string>();
      set.add(merchant);
      merchantsByToken.set(token, set);
    }
  }
  return new Set([...merchantsByToken.entries()].filter(([, merchants]) => merchants.size >= minDistinct).map(([token]) => token));
}

export interface MerchantResolverContext {
  knownMerchants: string[];
  noiseTokens: Set<string>;
}

export interface ResolvedMerchant {
  name: string;
  matchedKnown: boolean;
}

function titleCase(tokens: string[]): string {
  return tokens.map((t) => t.charAt(0) + t.slice(1).toLowerCase()).join(" ");
}

export function resolveMerchant(description: string, context: MerchantResolverContext): ResolvedMerchant | null {
  const tokens = stripBankPrefixes(normalizeDescriptionTokens(description));
  if (tokens.length === 0) return null;

  const isTransfer = isTransferDescription(normalizeDescriptionTokens(description));
  if (isTransfer) {
    const counterparty = resolveTransferCounterparty(tokens, normalizeDescriptionTokens(description));
    if (counterparty) return { name: counterparty, matchedKnown: context.knownMerchants.includes(counterparty) };
  }

  const onlyGenericWords = tokens.every((t) => GENERIC_MERCHANT_TERMS.has(t) || STOP_TOKENS.has(t));
  const known = context.knownMerchants
    .map((name) => ({ name, key: merchantKey(name) }))
    .filter((m) => m.key.length >= MIN_KNOWN_KEY_LENGTH)
    .filter((m) => onlyGenericWords || !isGenericMerchant(m.name))
    .filter((m) => containsAtWordBoundary(tokens, m.key))
    .sort((a, b) => b.key.length - a.key.length)[0];
  if (known) return { name: known.name, matchedKnown: true };

  const meaningful = trimSingleLetters(tokens.filter((t) => !STOP_TOKENS.has(t) && !context.noiseTokens.has(t)));
  const kept = meaningful.length > 0 ? meaningful : trimSingleLetters(tokens);
  if (kept.length === 0) return null;
  return { name: titleCase(kept.slice(0, 4)), matchedKnown: false };
}

function isGenericMerchant(name: string): boolean {
  const tokens = normalizeDescriptionTokens(name);
  return tokens.length > 0 && tokens.every((t) => GENERIC_MERCHANT_TERMS.has(t));
}

function trimSingleLetters(tokens: string[]): string[] {
  let start = 0;
  let end = tokens.length;
  while (start < end && tokens[start].length === 1) start++;
  while (end > start && tokens[end - 1].length === 1) end--;
  return tokens.slice(start, end);
}

const MAX_WINDOW_TOKENS = 4;

function containsAtWordBoundary(tokens: string[], key: string): boolean {
  for (let start = 0; start < tokens.length; start++) {
    let concatenated = "";
    for (let end = start; end < Math.min(tokens.length, start + MAX_WINDOW_TOKENS); end++) {
      concatenated += tokens[end];
      if (concatenated === key) return true;
      if (end === start && concatenated.startsWith(key) && key.length >= MIN_KNOWN_KEY_LENGTH) return true;
    }
  }
  return false;
}

function isTransferDescription(allTokens: string[]): boolean {
  return allTokens.some((t) => TRANSFER_MARKERS.includes(t));
}

export function findInstitution(tokens: string[]): string | null {
  for (const institution of KNOWN_INSTITUTIONS) {
    for (let i = 0; i + institution.tokens.length <= tokens.length; i++) {
      if (institution.tokens.every((t, j) => tokens[i + j] === t)) return institution.name;
    }
  }
  return null;
}

function resolveTransferCounterparty(strippedTokens: string[], allTokens: string[]): string | null {
  const institution = findInstitution(strippedTokens);
  if (institution) return institution;

  const markerIndex = strippedTokens.findIndex((t) => t === "TRANSFERENCIA" || t === "TRANSFER");
  if (markerIndex > 0) {
    const person = trimSingleLetters(strippedTokens.slice(0, markerIndex).filter((t) => !STOP_TOKENS.has(t)));
    if (person.length > 0) return titleCase(person.slice(0, 4));
  }
  return allTokens.includes("SPEI") ? "SPEI" : null;
}

const UNIDENTIFIED_MERCHANT_KEY = merchantKey("Sin identificar");
const PAYMENT_RAILS = new Set(["SPEI"]);

export function isIdentifiableMerchant(name: string): boolean {
  const tokens = normalizeDescriptionTokens(name);
  if (tokens.length === 0 || merchantKey(name) === UNIDENTIFIED_MERCHANT_KEY) return false;
  if (tokens.every((t) => PAYMENT_RAILS.has(t))) return false;
  return !tokens.every((t) => GENERIC_MERCHANT_TERMS.has(t));
}

export function sameMerchant(a: string, b: string): boolean {
  const ka = merchantKey(a);
  const kb = merchantKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  const [short, long] = ka.length <= kb.length ? [ka, kb] : [kb, ka];
  return short.length >= 3 && long.includes(short);
}
