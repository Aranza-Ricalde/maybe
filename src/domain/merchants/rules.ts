export function normalizeMerchantPattern(rawDescription: string): string {
  return rawDescription
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\d+/g, "")
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function legacyMerchantPattern(rawDescription: string): string {
  return rawDescription
    .toUpperCase()
    .replace(/\d+/g, "")
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MAX_CLEAN_NAME_LENGTH = 60;

export function sanitizeCleanName(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .split("\n")[0]
    .trim();
  if (!cleaned) {
    throw new Error("Gemini devolvió un nombre de comercio vacío");
  }
  return cleaned.slice(0, MAX_CLEAN_NAME_LENGTH);
}
