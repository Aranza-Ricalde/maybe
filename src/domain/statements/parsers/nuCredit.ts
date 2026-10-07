import { allText, buildValidation, cleanDescription, groupIntoLines, isoDate, monthNumber, moneyNearLabel, normalizeText, parseMoneyCents, sumCents, type Line } from "../text";
import { isSummaryLayout, parseSummaryLayout } from "./nuCreditSummaryLayout";
import { StatementFormatError, type ForeignAmount, type ParsedStatement, type ParsedStatementTransaction, type PdfWord, type StatementMetadataValue, type StatementParser } from "../types";

const SIGNED_AMOUNT = /^[+-]\$\d{1,3}(?:,\d{3})*\.\d{2}$|^[+-]\$\d+\.\d{2}$/;
const PERIOD = /Periodo:\s*(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{4})\s+al\s+(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{4})/i;
const NUMERIC_DATE = /(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{4})/;
const RFC_SUFFIX = /\s*\|\s*RFC:.*$/i;
const PAYMENT_THANKS = /gr[aá]cias por tu pago/i;
const EXCHANGE = /Cambio\s*\(\s*([A-Z]{3})\s*1\s*=\s*\$?([\d,.]+)\s*\)\s*([A-Z]{3})\s*([\d,.]+)/i;
const DEFERRED_SECTION = /(DIFERIDOS A MESES|COMPRAS A MESES|MESES SIN INTERESES|MESES CON INTERESES)/i;
const BASE_CURRENCY = "MXN";

function dateFrom(tokens: string[]): string | null {
  const month = monthNumber(tokens[1] ?? "");
  return month && /^\d{1,2}$/.test(tokens[0] ?? "") && /^\d{4}$/.test(tokens[2] ?? "") ? isoDate(Number(tokens[2]), month, Number(tokens[0])) : null;
}

function dateInText(text: string): string | null {
  const match = NUMERIC_DATE.exec(text);
  return match ? dateFrom([match[1], match[2], match[3]]) : null;
}

function foreignOf(subLines: Line[]): ForeignAmount | undefined {
  for (const line of subLines) {
    const match = EXCHANGE.exec(line.text);
    if (!match) continue;
    const rate = Number(match[2].replace(/,/g, ""));
    if (match[3] === BASE_CURRENCY && rate === 1) return undefined;
    return { currency: match[3], amountText: match[4], exchangeRateText: match[2] };
  }
  return undefined;
}

export const nuCreditParser: StatementParser = {
  bank: "nu_credito",

  detect(words) {
    const text = normalizeText(allText(words));
    return (text.includes("tarjeta de credito nu") && text.includes("cargos, abonos y compras regulares")) || isSummaryLayout(words);
  },

  parse(words: PdfWord[]): ParsedStatement {
    if (isSummaryLayout(words)) return parseSummaryLayout(words);
    const lines = groupIntoLines(words);
    const periodMatch = lines.map((l) => PERIOD.exec(l.text)).find((m) => m);
    const startMonth = periodMatch ? monthNumber(periodMatch[2]) : null;
    const endMonth = periodMatch ? monthNumber(periodMatch[5]) : null;
    if (!periodMatch || !startMonth || !endMonth) throw new StatementFormatError("No se encontró el periodo del estado de Nu crédito.");
    const periodStart = isoDate(Number(periodMatch[3]), startMonth, Number(periodMatch[1]));
    const periodEnd = isoDate(Number(periodMatch[6]), endMonth, Number(periodMatch[4]));

    const cardLine = lines.find((l) => /N[uú]mero de tarjeta:/i.test(l.text));
    const cardDigits = cardLine?.text.replace(/.*N[uú]mero de tarjeta:/i, "").replace(/\D/g, "") ?? "";

    const tableStart = lines.findIndex((l) => /CARGOS, ABONOS Y COMPRAS REGULARES/i.test(l.text));
    if (tableStart < 0) throw new StatementFormatError("No se encontró la tabla de movimientos de Nu crédito.");
    const totalIndex = lines.findIndex((l, i) => i > tableStart && /Total de cargos/i.test(l.text));
    const tableLines = lines.slice(tableStart + 1, totalIndex < 0 ? undefined : totalIndex);

    const rows: Array<{ line: Line; subLines: Line[] }> = [];
    for (const line of tableLines) {
      const tokens = line.words.map((w) => w.text);
      const isRow = dateFrom(tokens.slice(0, 3)) !== null && dateFrom(tokens.slice(3, 6)) !== null && SIGNED_AMOUNT.test(tokens[tokens.length - 1]);
      if (isRow) rows.push({ line, subLines: [] });
      else if (rows.length > 0) rows[rows.length - 1].subLines.push(line);
    }

    const transactions: ParsedStatementTransaction[] = rows.map(({ line, subLines }) => {
      const tokens = line.words.map((w) => w.text);
      const signed = parseMoneyCents(tokens[tokens.length - 1]);
      const description = cleanDescription(tokens.slice(6, -1).join(" ").replace(RFC_SUFFIX, ""));
      const isPayment = signed < 0;
      const foreign = foreignOf(subLines);
      return {
        date: dateFrom(tokens.slice(0, 3)) as string,
        postedDate: dateFrom(tokens.slice(3, 6)) as string,
        description: description || "Movimiento Nu crédito",
        amountCents: -signed,
        type: isPayment ? (PAYMENT_THANKS.test(description) || subLines.some((l) => /Abono \(con cuenta Nu\)/i.test(l.text)) ? "card_payment" : "income") : "expense",
        ...(foreign ? { foreign } : {}),
      };
    });

    const totalChargesLine = lines.find((l) => /Total de cargos/i.test(l.text));
    const totalCreditsLine = lines.find((l) => /Total de abonos/i.test(l.text));
    const amountOf = (line: Line | undefined) => {
      const token = line?.words.map((w) => w.text).find((t) => SIGNED_AMOUNT.test(t));
      return token ? Math.abs(parseMoneyCents(token)) : null;
    };
    const expectedCharges = amountOf(totalChargesLine);
    const expectedCredits = amountOf(totalCreditsLine);
    const actualCharges = sumCents(transactions.filter((t) => t.amountCents < 0).map((t) => -t.amountCents));
    const actualCredits = sumCents(transactions.filter((t) => t.amountCents > 0).map((t) => t.amountCents));

    const summaryLines = lines.slice(0, tableStart);
    const previousDebt = moneyNearLabel(summaryLines, /Adeudo del periodo anterior/i, 0);
    const interest = moneyNearLabel(summaryLines, /Monto de intereses\s*\d*\s*\+/i, 0) ?? 0;
    const commissionsAmount = moneyNearLabel(summaryLines, /Monto de comisiones\b(?!.*totales)/i, 0) ?? 0;
    const vat = moneyNearLabel(summaryLines, /IVA de intereses y comisiones/i, 0) ?? 0;
    const deferredCharges = moneyNearLabel(summaryLines, /Cargos y compras a meses/i, 0) ?? 0;
    const payToAvoidInterest = moneyNearLabel(summaryLines, /Pago para no generar intereses\s*\d*\s*:/i);
    const minimumPayment = moneyNearLabel(summaryLines, /^\s*Pago m[ií]nimo\s*\d*\s*:/i);
    const creditLimit = moneyNearLabel(summaryLines, /L[ií]mite de cr[eé]dito/i, 0);
    const available = moneyNearLabel(summaryLines, /^\s*Cr[eé]dito disponible\b(?!.*disposiciones)/i, 0);
    const cutoff = dateInText(summaryLines.find((l) => /Fecha de corte:/i.test(l.text))?.text ?? "");
    const dueDate = dateInText(summaryLines.find((l) => /Fecha l[ií]mite de pago/i.test(l.text))?.text ?? "");

    const metadata: Record<string, StatementMetadataValue> = {};
    if (cutoff) metadata.cutoffDate = cutoff;
    if (dueDate) metadata.dueDate = dueDate;
    if (payToAvoidInterest != null) metadata.noInterestPaymentCents = payToAvoidInterest;
    if (minimumPayment != null) metadata.minimumPaymentCents = minimumPayment;
    if (creditLimit != null) metadata.creditLimitCents = creditLimit;
    if (available != null) metadata.availableCreditCents = available;

    const checks = [
      ...(expectedCharges != null ? [{ label: "Total de cargos", expected: expectedCharges, actual: actualCharges, isMoney: true }] : []),
      ...(expectedCredits != null ? [{ label: "Total de abonos", expected: expectedCredits, actual: actualCredits, isMoney: true }] : []),
      ...(previousDebt != null && payToAvoidInterest != null
        ? [{ label: "Pago para no generar intereses = adeudo anterior + cargos + intereses y comisiones − abonos", expected: payToAvoidInterest, actual: previousDebt + actualCharges + deferredCharges + interest + commissionsAmount + vat - actualCredits, isMoney: true }]
        : []),
    ];

    const warnings: string[] = [];
    const afterTotals = totalIndex < 0 ? [] : lines.slice(totalIndex + 1);
    const deferredHeading = afterTotals.findIndex((l) => DEFERRED_SECTION.test(l.text) && !/NO A MESES/i.test(l.text) && l.text === l.text.toUpperCase());
    if (deferredHeading >= 0 && afterTotals.slice(deferredHeading + 1).some((l) => dateFrom(l.words.map((w) => w.text).slice(0, 3)) !== null)) {
      warnings.push("El estado trae compras a meses (MSI) que esta importación todavía no sabe leer; revísalas a mano.");
    }
    if (checks.length === 0) warnings.push("No se encontraron los totales del estado para validarlo.");
    if (transactions.length === 0) warnings.push("No se encontraron movimientos en el estado.");

    return {
      bank: "nu_credito",
      accountLast4: cardDigits.length >= 4 ? cardDigits.slice(-4) : null,
      periodStart,
      periodEnd,
      openingBalanceCents: previousDebt != null ? -previousDebt : null,
      closingBalanceCents: payToAvoidInterest != null ? -payToAvoidInterest : null,
      transactions,
      validation: buildValidation(checks),
      metadata,
      warnings,
    };
  },
};
