import { allText, buildValidation, cleanDescription, groupIntoLines, inferDateInPeriod, isoDate, monthNumber, moneyAfterLabel, normalizeText, parseMoneyCents, sumCents, type Line } from "../text";
import { StatementFormatError, type ParsedStatement, type ParsedStatementTransaction, type PdfWord, type StatementParser } from "../types";

const SIGNED_AMOUNT = /^[+-]\$\d{1,3}(?:,\d{3})*\.\d{2}$|^[+-]\$\d+\.\d{2}$/;
const PERIOD = /Periodo:\s*del\s+(\d{1,2})(?:\s+([A-Za-zÁÉÍÓÚáéíóú]{3}))?\s+al\s+(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{4})/i;
const DESCRIPTION_MIN_X = 125;
const AMOUNT_MIN_X = 380;
const CAJITA_LINE = /^(Retiro de|Dep[oó]sito en) Cajita/i;
const CARD_PAYMENT = /Pago a tu tarjeta de cr[eé]dito Nu/i;
const INTEREST_DESCRIPTION = "Dinero generado del mes (interés Cajitas Nu)";

function periodOf(lines: Line[]): { start: string; end: string } {
  const match = lines.map((l) => PERIOD.exec(l.text)).find((m) => m);
  const endMonth = match ? monthNumber(match[4]) : null;
  if (!match || !endMonth) throw new StatementFormatError("No se encontró el periodo del estado de Nu.");
  const startMonth = match[2] ? monthNumber(match[2]) : endMonth;
  if (!startMonth) throw new StatementFormatError("No se reconoció el mes de inicio del periodo de Nu.");
  const endYear = Number(match[5]);
  const startYear = startMonth > endMonth ? endYear - 1 : endYear;
  return { start: isoDate(startYear, startMonth, Number(match[1])), end: isoDate(endYear, endMonth, Number(match[3])) };
}

const isDateStart = (line: Line) => {
  const [first, second] = line.words;
  return first !== undefined && second !== undefined && first.x0 < DESCRIPTION_MIN_X && /^\d{1,2}$/.test(first.text) && monthNumber(second.text) !== null;
};

export const nuDebitParser: StatementParser = {
  bank: "nu_debito",

  detect(words) {
    const text = normalizeText(allText(words));
    return text.includes("detalle de movimientos en tu cuenta") && (text.includes("cuenta nu") || text.includes("nubank"));
  },

  parse(words: PdfWord[]): ParsedStatement {
    const lines = groupIntoLines(words);
    const period = periodOf(lines);
    const accountLine = lines.find((l) => /Cuenta Nu:/i.test(l.text));
    const accountDigits = accountLine?.text.replace(/.*Cuenta Nu:/i, "").replace(/\D/g, "") ?? "";

    const sectionStart = lines.findIndex((l) => normalizeText(l.text).includes("detalle de movimientos en tu cuenta"));
    if (sectionStart < 0) throw new StatementFormatError("No se encontró el detalle de movimientos de Nu.");
    const summaryLines = lines.slice(0, sectionStart);

    const opening = moneyAfterLabel(summaryLines, /^\s*Saldo inicial\b/i);
    const deposits = moneyAfterLabel(summaryLines, /^\s*Dep[oó]sitos\b/i);
    const expenses = moneyAfterLabel(summaryLines, /^\s*Gastos\b/i);
    const commissions = moneyAfterLabel(summaryLines, /^\s*Comisiones cobradas por Nu\b/i) ?? 0;
    const generated = moneyAfterLabel(summaryLines, /^\s*Dinero generado este mes\b/i) ?? 0;
    const closing = moneyAfterLabel(summaryLines, /^\s*Saldo al generar este estado de cuenta\b/i);

    const transactions: ParsedStatementTransaction[] = [];
    let date: { day: number; month: number } | null = null;
    for (const line of lines.slice(sectionStart + 1)) {
      const normalized = normalizeText(line.text);
      if (normalized.includes("movimientos de tus cajitas")) break;
      if (isDateStart(line)) date = { day: Number(line.words[0].text), month: monthNumber(line.words[1].text) as number };
      const amountWord = [...line.words].reverse().find((w) => SIGNED_AMOUNT.test(w.text) && w.x0 >= AMOUNT_MIN_X);
      if (!amountWord || !date) continue;

      const description = line.words
        .filter((w) => w !== amountWord && w.x0 >= DESCRIPTION_MIN_X)
        .map((w) => w.text)
        .join(" ");
      const cents = parseMoneyCents(amountWord.text);
      const type = CAJITA_LINE.test(description) ? "internal_transfer" : CARD_PAYMENT.test(description) ? "card_payment" : cents < 0 ? "expense" : "income";
      transactions.push({
        date: inferDateInPeriod(date.day, date.month, period.start, period.end),
        description: cleanDescription(description.replace(/\s+Compra$/i, "")) || "Movimiento Nu",
        amountCents: cents,
        type,
      });
    }

    if (generated > 0) {
      transactions.push({ date: period.end, description: INTEREST_DESCRIPTION, amountCents: generated, type: "income", derived: true });
    }

    const regular = transactions.filter((t) => t.type !== "internal_transfer" && !t.derived);
    const actualDeposits = sumCents(regular.filter((t) => t.amountCents > 0).map((t) => t.amountCents));
    const actualExpenses = sumCents(regular.filter((t) => t.amountCents < 0).map((t) => -t.amountCents));
    const expectedExpenses = expenses != null ? Math.abs(expenses) : null;

    const checks = [
      ...(deposits != null ? [{ label: "Depósitos", expected: deposits, actual: actualDeposits, isMoney: true }] : []),
      ...(expectedExpenses != null ? [{ label: "Gastos", expected: expectedExpenses, actual: actualExpenses, isMoney: true }] : []),
      ...(opening != null && closing != null && deposits != null && expenses != null
        ? [{ label: "Saldo al generar el estado = saldo inicial + depósitos − gastos − comisiones + dinero generado", expected: closing, actual: opening + deposits + expenses - Math.abs(commissions) + generated, isMoney: true }]
        : []),
    ];
    const warnings: string[] = [];
    if (checks.length === 0) warnings.push("No se encontró el resumen del estado para validar los totales.");
    if (regular.length === 0) warnings.push("No se encontraron movimientos en el estado.");

    return {
      bank: "nu_debito",
      accountLast4: accountDigits.length >= 4 ? accountDigits.slice(-4) : null,
      periodStart: period.start,
      periodEnd: period.end,
      openingBalanceCents: opening,
      closingBalanceCents: closing,
      transactions,
      validation: buildValidation(checks),
      metadata: {},
      warnings,
    };
  },
};
