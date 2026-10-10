const PERCENT_ENCODED = /%[0-9a-f]{2}/i;
const NON_ASCII = /[\u0080-ÿ]/;
const REPLACEMENT = "�";

export function decodeHeaderText(value: string): string {
  const trimmed = value.trim();
  if (PERCENT_ENCODED.test(trimmed)) {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  }
  if (!NON_ASCII.test(trimmed) || [...trimmed].some((char) => char.charCodeAt(0) > 0xff)) return trimmed;
  const decoded = Buffer.from(trimmed, "latin1").toString("utf8");
  return decoded.includes(REPLACEMENT) ? trimmed : decoded;
}
