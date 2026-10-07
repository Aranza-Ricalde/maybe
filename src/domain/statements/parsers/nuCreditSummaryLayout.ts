import { allText, buildValidation, cleanDescription, groupIntoLines, inferDateInPeriod, isoDate, monthNumber, normalizeText, sumCents, type Line } from "../text";
import { StatementFormatError, type ParsedStatement, type ParsedStatementTransaction, type PdfWord, type StatementMetadataValue } from "../types";

const AMOUNT = /^-?\$(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{2}))?$/;
const PERIOD = /Periodo:\s*(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{4})\s*-\s*(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{4})/i;
const DATE_AFTER_LABEL = /(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{4})/;
const DESCRIPTION_MIN_X = 255;
const CARD_PAYMENT = /pago a tu tarjeta/i;
const OWN_ACCOUNT_DISPOSITION = /disposici[oó]n de saldo en cuenta nu/i;
const NON_PURCHASE = /^(intereses|disposici[oó]n|ajuste iva|iva\b|comisi[oó]n|retiro)/i;

function centsOf(token: string): number {
  const match = AMOUNT.exec(token);
  if (!match) throw new StatementFormatError(`Monto inválido en el estado: "${token}"`);
  const cents = Number(match[1].replace(/,/g, "")) * 100 + Number(match[2] ?? "0");
  return token.startsWith("-") ? -cents : cents;
}

function amountOnLine(line: Line | undefined): number | null {
  const token = line?.words.map((w) => w.text).filter((t) => AMOUNT.test(t)).at(-1);
  return token ? Math.abs(centsOf(token)) : null;
}

function labelAmount(lines: Line[], label: RegExp): number | null {
  return amountOnLine(lines.find((line) => label.test(line.text)));
}

function dateAfter(lines: Line[], label: RegExp): string | null {
  const match = DATE_AFTER_LABEL.exec(lines.find((line) => label.test(line.text))?.text.replace(label, "") ?? "");
  const month = match ? monthNumber(match[2]) : null;
  return match && month ? isoDate(Number(match[3]), month, Number(match[1])) : null;
}

export function isSummaryLayout(words: PdfWord[]): boolean {
  const text = normalizeText(allText(words));
  return text.includes("resumen de transacciones") && text.includes("uso de tu tarjeta de credito");
}

export function parseSummaryLayout(words: PdfWord[]): ParsedStatement {
  const lines = groupIntoLines(words);
  const periodMatch = lines.map((l) => PERIOD.exec(l.text)).find((m) => m);
  const startMonth = periodMatch ? monthNumber(periodMatch[2]) : null;
  const endMonth = periodMatch ? monthNumber(periodMatch[5]) : null;
  if (!periodMatch || !startMonth || !endMonth) throw new StatementFormatError("No se encontró el periodo del estado de Nu crédito.");
  const periodStart = isoDate(Number(periodMatch[3]), startMonth, Number(periodMatch[1]));
  const periodEnd = isoDate(Number(periodMatch[6]), endMonth, Number(periodMatch[4]));

  const cardLine = lines.find((l) => /^TARJETA:/i.test(l.text));
  const cardDigits = cardLine?.words.at(-1)?.text.replace(/\D/g, "") ?? "";

  const tableStart = lines.findIndex((l) => /^TRANSACCIONES DE\b/i.test(l.text));
  if (tableStart < 0) throw new StatementFormatError("No se encontró la tabla de movimientos de Nu crédito.");
  const tableEnd = lines.findIndex((l, i) => i > tableStart && /Saldo final del periodo/i.test(l.text));
  const tableLines = lines.slice(tableStart, tableEnd < 0 ? undefined : tableEnd);
  const summaryLines = lines.slice(0, tableStart);

  const transactions: ParsedStatementTransaction[] = [];
  for (const line of tableLines) {
    const tokens = line.words.map((w) => w.text);
    const month = monthNumber(tokens[1] ?? "");
    const last = tokens.at(-1) ?? "";
    if (!/^\d{1,2}$/.test(tokens[0] ?? "") || !month || !AMOUNT.test(last)) continue;
    const isCredit = tokens.at(-2) === "-" || last.startsWith("-");
    const magnitude = Math.abs(centsOf(last));
    const description = cleanDescription(line.words.filter((w) => w.x0 >= DESCRIPTION_MIN_X && w.text !== "-" && !AMOUNT.test(w.text)).map((w) => w.text).join(" "));
    const isOwnDisposition = !isCredit && OWN_ACCOUNT_DISPOSITION.test(description);
    transactions.push({
      date: inferDateInPeriod(Number(tokens[0]), month, periodStart, periodEnd),
      description: description || "Movimiento Nu crédito",
      amountCents: isCredit ? magnitude : -magnitude,
      type: isCredit ? (CARD_PAYMENT.test(description) ? "card_payment" : "income") : "expense",
      ...(isOwnDisposition ? { suggestedType: "internal_transfer" as const } : {}),
    });
  }

  const opening = labelAmount(summaryLines, /^Saldo inicial del periodo/i);
  const expectedPayments = labelAmount(summaryLines, /^Pagos a tu tarjeta/i);
  const expectedPurchases = labelAmount(summaryLines, /^Compras\s*\$/i);
  const expectedCredits = labelAmount(summaryLines, /^Abonos y devoluciones/i);
  const closing = labelAmount(summaryLines, /^Saldo total del periodo\s*\$/i);

  const payments = transactions.filter((t) => t.type === "card_payment");
  const otherCredits = transactions.filter((t) => t.type === "income");
  const purchases = transactions.filter((t) => t.amountCents < 0 && !NON_PURCHASE.test(t.description));
  const charges = transactions.filter((t) => t.amountCents < 0);
  const credits = transactions.filter((t) => t.amountCents > 0);

  const checks = [
    ...(expectedPayments != null ? [{ label: "Pagos a tu tarjeta", expected: expectedPayments, actual: sumCents(payments.map((t) => t.amountCents)), isMoney: true }] : []),
    ...(expectedCredits != null ? [{ label: "Abonos y devoluciones", expected: expectedCredits, actual: sumCents(otherCredits.map((t) => t.amountCents)), isMoney: true }] : []),
    ...(expectedPurchases != null ? [{ label: "Compras", expected: expectedPurchases, actual: sumCents(purchases.map((t) => -t.amountCents)), isMoney: true }] : []),
    ...(opening != null && closing != null ? [{ label: "Saldo total = saldo inicial + cargos − pagos y abonos", expected: closing, actual: opening + sumCents(charges.map((t) => -t.amountCents)) - sumCents(credits.map((t) => t.amountCents)), isMoney: true }] : []),
  ];

  const metadata: Record<string, StatementMetadataValue> = {};
  const cutoff = dateAfter(summaryLines, /^.*Fecha de corte:/i);
  const dueDate = dateAfter(summaryLines, /^.*Fecha l[ií]mite de pago:/i);
  if (cutoff) metadata.cutoffDate = cutoff;
  if (dueDate) metadata.dueDate = dueDate;
  const noInterest = labelAmount(summaryLines, /^Pago para no generar intereses/i);
  const minimum = labelAmount(summaryLines, /^Pago m[ií]nimo requerido/i);
  const limit = labelAmount(summaryLines, /L[ií]mite de cr[eé]dito/i);
  const available = labelAmount(summaryLines, /^L[ií]mite disponible/i);
  if (noInterest != null) metadata.noInterestPaymentCents = noInterest;
  if (minimum != null) metadata.minimumPaymentCents = minimum;
  if (limit != null) metadata.creditLimitCents = limit;
  if (available != null) metadata.availableCreditCents = available;

  const warnings: string[] = [];
  if (checks.length === 0) warnings.push("No se encontraron los totales del estado para validarlo.");
  if (transactions.length === 0) warnings.push("No se encontraron movimientos en el estado.");
  if (transactions.some((t) => t.suggestedType === "internal_transfer")) warnings.push("Hay una disposición de saldo hacia tu Cuenta Nu: revísala, probablemente es una transferencia entre tus cuentas.");

  return {
    bank: "nu_credito",
    accountLast4: cardDigits.length >= 4 ? cardDigits.slice(-4) : null,
    periodStart,
    periodEnd,
    openingBalanceCents: opening != null ? -opening : null,
    closingBalanceCents: closing != null ? -closing : null,
    transactions,
    validation: buildValidation(checks),
    metadata,
    warnings,
  };
}
