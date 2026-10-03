export class TelegramParseError extends Error {}

export interface ParsedTelegramEntry {
  amountCents: number;
  description: string;
  accountHint?: string;
}

const ENTRY_PATTERN = /^([+-]?\d+(?:[.,]\d{1,2})?)\s+(.+)$/;
const ACCOUNT_HINT_PATTERN = /^(.*)\s+#(\S+)$/;

export function parseTelegramMessage(text: string): ParsedTelegramEntry {
  const trimmed = text.trim();
  const match = trimmed.match(ENTRY_PATTERN);
  if (!match) {
    throw new TelegramParseError(
      'No entendí. Formato: "150 tacos" (gasto) o "+20000 nómina" (ingreso). Puedes agregar "#cuenta" al final.',
    );
  }
  const [, amountToken, rest] = match;

  let description = rest.trim();
  let accountHint: string | undefined;
  const hintMatch = description.match(ACCOUNT_HINT_PATTERN);
  if (hintMatch) {
    description = hintMatch[1].trim();
    accountHint = hintMatch[2];
  }
  if (!description) {
    throw new TelegramParseError("Falta la descripción del movimiento.");
  }

  const hasExplicitPlus = amountToken.startsWith("+");
  const numeric = Number(amountToken.replace(/^\+/, "").replace(",", "."));
  if (Number.isNaN(numeric) || numeric === 0) {
    throw new TelegramParseError(`Monto inválido: "${amountToken}"`);
  }

  const cents = Math.round(Math.abs(numeric) * 100);
  return { amountCents: hasExplicitPlus ? cents : -cents, description, accountHint };
}

export const LINK_COMMANDS = ["/start", "/link"];
