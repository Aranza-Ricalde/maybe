import { InvalidSpokenDateError, extractTrailingDate } from "./dateWords";

export const DRAFT_TTL_HOURS = 6;

export class TelegramParseError extends Error {}
export class TelegramDateError extends TelegramParseError {}

export interface ParsedTelegramEntry {
  amountCents: number;
  description: string;
  accountHint?: string;
  date?: string;
}

const ENTRY_PATTERN = /^([+-]?\d+(?:[.,]\d{1,2})?)\s+(.+)$/;
const ACCOUNT_HINT_PATTERN = /^([\s\S]*?)\s+#(\S+)$/;

export const UNRECOGNIZED_MESSAGE_HELP = 'No entendí. Formato: "150 tacos" (gasto) o "+20000 nómina" (ingreso). Puedes agregar "#cuenta" al final, o pegar la notificación de tu banco.';

export function splitAccountHint(text: string): { text: string; accountHint?: string } {
  const match = text.trim().match(ACCOUNT_HINT_PATTERN);
  return match ? { text: match[1].trim(), accountHint: match[2] } : { text: text.trim() };
}

function spokenDate(text: string, today: string | undefined) {
  if (!today) return { text };
  try {
    return extractTrailingDate(text, today);
  } catch (error) {
    if (error instanceof InvalidSpokenDateError) throw new TelegramDateError(error.message);
    throw error;
  }
}

export function parseTelegramMessage(text: string, today?: string): ParsedTelegramEntry {
  const trimmed = text.trim();
  const match = trimmed.match(ENTRY_PATTERN);
  if (!match) throw new TelegramParseError(UNRECOGNIZED_MESSAGE_HELP);
  const [, amountToken, rest] = match;

  const { text: withDate, accountHint } = splitAccountHint(rest);
  const { text: description, date } = spokenDate(withDate, today);
  if (!description) {
    throw new TelegramParseError("Falta la descripción del movimiento.");
  }

  const hasExplicitPlus = amountToken.startsWith("+");
  const numeric = Number(amountToken.replace(/^\+/, "").replace(",", "."));
  if (Number.isNaN(numeric) || numeric === 0) {
    throw new TelegramParseError(`Monto inválido: "${amountToken}"`);
  }

  const cents = Math.round(Math.abs(numeric) * 100);
  return { amountCents: hasExplicitPlus ? cents : -cents, description, accountHint, date };
}

export const LINK_COMMANDS = ["/start", "/link"];

export interface LinkCommand {
  code: string | null;
}

export function parseLinkCommand(text: string): LinkCommand | null {
  const [command, code] = text.trim().split(/\s+/);
  if (!LINK_COMMANDS.includes(command)) return null;
  return { code: code ?? null };
}
