import type { PdfWord, StatementCheck, StatementValidation } from "./types";
import { StatementFormatError } from "./types";

export const LINE_TOLERANCE = 3;

const SPANISH_MONTHS: Record<string, number> = { ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6, JUL: 7, AGO: 8, SEP: 9, SEPT: 9, OCT: 10, NOV: 11, DIC: 12 };

const stripAccents = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "");

export const normalizeText = (text: string) => stripAccents(text).toLowerCase().replace(/\s+/g, " ").trim();

export function monthNumber(token: string): number | null {
  return SPANISH_MONTHS[stripAccents(token).toUpperCase().replace(/\.$/, "")] ?? null;
}

export function isoDate(year: number, month: number, day: number): string {
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (Number.isNaN(Date.parse(`${iso}T00:00:00Z`)) || new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) !== iso) throw new StatementFormatError(`Fecha inválida en el estado: ${iso}`);
  return iso;
}

export interface Line {
  page: number;
  top: number;
  words: PdfWord[];
  text: string;
}

export function groupIntoLines(words: PdfWord[], tolerance: number = LINE_TOLERANCE): Line[] {
  const sorted = [...words].sort((a, b) => a.page - b.page || a.top - b.top || a.x0 - b.x0);
  const lines: Line[] = [];
  let current: PdfWord[] = [];
  let reference = Number.NaN;
  let page = -1;
  const flush = () => {
    if (current.length === 0) return;
    const ordered = [...current].sort((a, b) => a.x0 - b.x0);
    lines.push({ page: ordered[0].page, top: reference, words: ordered, text: ordered.map((w) => w.text).join(" ") });
    current = [];
  };
  for (const word of sorted) {
    if (word.page !== page || Math.abs(word.top - reference) > tolerance) {
      flush();
      page = word.page;
      reference = word.top;
    }
    current.push(word);
  }
  flush();
  return lines;
}

const MONEY = /^([+-])?\$?(\d{1,3}(?:,\d{3})*|\d+)\.(\d{2})$/;

export function isMoneyToken(token: string): boolean {
  return MONEY.test(token);
}

export function parseMoneyCents(token: string): number {
  const match = MONEY.exec(token.trim());
  if (!match) throw new StatementFormatError(`Monto inválido en el estado: "${token}"`);
  const cents = Number(match[2].replace(/,/g, "")) * 100 + Number(match[3]);
  return match[1] === "-" ? -cents : cents;
}

export function moneyAfterLabel(lines: Line[], label: RegExp): number | null {
  for (const line of lines) {
    if (!label.test(line.text)) continue;
    const money = line.words.filter((w) => isMoneyToken(w.text));
    if (money.length > 0) return parseMoneyCents(money[money.length - 1].text);
  }
  return null;
}

export function buildValidation(checks: StatementCheck[]): StatementValidation {
  return { checks, matches: checks.every((check) => check.expected === check.actual) };
}

export function sumCents(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

export const MAX_DESCRIPTION_LENGTH = 200;

export function cleanDescription(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_DESCRIPTION_LENGTH);
}

export function allText(words: PdfWord[]): string {
  return words.map((w) => w.text).join(" ");
}

export function inferDateInPeriod(day: number, month: number, periodStart: string, periodEnd: string): string {
  const years = [...new Set([Number(periodStart.slice(0, 4)), Number(periodEnd.slice(0, 4))])];
  const candidates = years.map((year) => isoDate(year, month, day));
  const inside = candidates.find((date) => date >= periodStart && date <= periodEnd);
  if (inside) return inside;
  const distance = (date: string) => Math.abs(Date.parse(date) - Date.parse(periodStart));
  return candidates.reduce((best, date) => (distance(date) < distance(best) ? date : best));
}

export function moneyNearLabel(lines: Line[], label: RegExp, lookAhead = 2): number | null {
  const index = lines.findIndex((line) => label.test(line.text));
  if (index < 0) return null;
  for (let i = index; i <= Math.min(lines.length - 1, index + lookAhead); i++) {
    const money = lines[i].words.filter((w) => isMoneyToken(w.text));
    if (money.length > 0) return parseMoneyCents(money[money.length - 1].text);
  }
  return null;
}
