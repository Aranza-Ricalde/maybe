export const BOT_COMMANDS = ["saldo", "ultimos", "resumen", "ayuda"] as const;
export type BotCommandName = (typeof BOT_COMMANDS)[number];

export interface BotCommand {
  name: BotCommandName | "desconocido";
  argument: string;
}

const COMMAND = /^\/([a-záéíóúñ_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i;

const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function parseBotCommand(text: string): BotCommand | null {
  const match = text.trim().match(COMMAND);
  if (!match) return null;
  const name = plain(match[1]);
  return { name: (BOT_COMMANDS as readonly string[]).includes(name) ? (name as BotCommandName) : "desconocido", argument: (match[2] ?? "").trim() };
}

export const DEFAULT_RECENT_COUNT = 5;
export const MAX_RECENT_COUNT = 15;

export function recentCount(argument: string): number {
  const requested = Number(argument);
  return Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_RECENT_COUNT) : DEFAULT_RECENT_COUNT;
}
