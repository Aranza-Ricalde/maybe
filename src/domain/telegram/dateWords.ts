import { MONTHS, inferDate, isRealDate, monthIndex } from "@/domain/captures/dates";
import { addDays } from "@/domain/payPeriod/rules";

export class InvalidSpokenDateError extends Error {}

const RELATIVE_DAYS: Record<string, number> = { hoy: 0, ayer: -1, anteayer: -2, antier: -2 };
const RELATIVE = /\s+(hoy|ayer|anteayer|antier)$/i;
const ISO = /\s+(\d{4})-(\d{2})-(\d{2})$/;
const SLASHED = /\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?$/;
const WORDED = new RegExp(`\\s+(\\d{1,2})\\s+(?:de\\s+)?(${MONTHS.join("|")})(?:\\s+(?:de\\s+)?(\\d{4}))?$`, "i");
const TWO_DIGIT_YEAR_BASE = 2000;

export interface TextWithDate {
  text: string;
  date?: string;
}

function resolve(day: number, month: number, year: number | undefined, today: string): string {
  const date = year !== undefined && !isRealDate(year, month, day) ? undefined : inferDate(day, month, year, today);
  if (!date) throw new InvalidSpokenDateError("Esa fecha no existe.");
  if (date > today) throw new InvalidSpokenDateError("La fecha no puede ser futura.");
  return date;
}

export function extractTrailingDate(text: string, today: string): TextWithDate {
  const strip = (match: RegExpMatchArray) => text.slice(0, match.index).trim();
  const withDate = (match: RegExpMatchArray, date: string): TextWithDate => ({ text: strip(match), date });

  const relative = text.match(RELATIVE);
  if (relative && strip(relative)) return withDate(relative, addDays(today, RELATIVE_DAYS[relative[1].toLowerCase()]));

  const iso = text.match(ISO);
  if (iso && strip(iso)) return withDate(iso, resolve(Number(iso[3]), Number(iso[2]) - 1, Number(iso[1]), today));

  const slashed = text.match(SLASHED);
  if (slashed && strip(slashed)) {
    const year = slashed[3] ? (slashed[3].length === 2 ? TWO_DIGIT_YEAR_BASE + Number(slashed[3]) : Number(slashed[3])) : undefined;
    return withDate(slashed, resolve(Number(slashed[1]), Number(slashed[2]) - 1, year, today));
  }

  const worded = text.match(WORDED);
  if (worded && strip(worded)) return withDate(worded, resolve(Number(worded[1]), monthIndex(worded[2]), worded[3] ? Number(worded[3]) : undefined, today));

  return { text };
}
