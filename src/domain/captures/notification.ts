import { pesosToCents } from "@/domain/shared/money";
import { MONTHS, inferDate, monthIndex } from "./dates";
import type { CaptureType } from "./rules";

export interface ParsedNotification {
  type: CaptureType;
  amountCents: number;
  description: string;
  date?: string;
}

const AMOUNT = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/;
const DATE = new RegExp(`\\b(\\d{1,2})\\s+(?:de\\s+)?(${MONTHS.join("|")})(?:\\s+(?:de\\s+)?(\\d{4}))?`, "i");
const MERCHANT = /\ben\s+(.+?)\s*\$\s*\d/i;
const INCOME_WORDS = /\b(deposito|abono|recibiste|te enviaron|te depositaron|transferencia recibida|spei recibido|nomina)\b/;
const EXPENSE_WORDS = /\b(compra|cargo|retiro|pago|enviaste|transferencia enviada|domiciliacion|disposicion)\b/;

const ACCOUNT_DEBIT_NOTICE = /\bcargo a tu cuenta\b/;
const TRANSFER_NOTICE_DESCRIPTION = "Transferencia enviada";

const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function parseBankNotification(text: string, today: string): ParsedNotification | null {
  const flat = text.replace(/\s+/g, " ").trim();
  const amountMatch = flat.match(AMOUNT);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const words = plain(flat);
  const isIncome = INCOME_WORDS.test(words);
  const isExpense = EXPENSE_WORDS.test(words);
  if (isIncome === isExpense) return null;

  const description = ACCOUNT_DEBIT_NOTICE.test(words) ? TRANSFER_NOTICE_DESCRIPTION : flat.match(MERCHANT)?.[1]?.trim();
  if (!description) return null;

  const dateMatch = flat.match(DATE);
  const date = dateMatch ? inferDate(Number(dateMatch[1]), monthIndex(dateMatch[2]), dateMatch[3] ? Number(dateMatch[3]) : undefined, today) : undefined;

  return { type: isIncome ? "income" : "expense", amountCents: pesosToCents(amount), description, ...(date ? { date } : {}) };
}
