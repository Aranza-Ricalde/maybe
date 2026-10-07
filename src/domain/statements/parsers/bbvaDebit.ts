import { allText, buildValidation, cleanDescription, groupIntoLines, inferDateInPeriod, isMoneyToken, isoDate, monthNumber, normalizeText, parseMoneyCents, sumCents, type Line } from "../text";
import { StatementFormatError, type ParsedStatement, type ParsedStatementTransaction, type PdfWord, type StatementParser } from "../types";

const DATE_TOKEN = /^(\d{2})\/([A-Za-z]{3})$/;
const PERIOD = /DEL\s+(\d{2})\/(\d{2})\/(\d{4})\s+AL\s+(\d{2})\/(\d{2})\/(\d{4})/i;
const MONEY_PLAIN = /^\d{1,3}(?:,\d{3})*\.\d{2}$/;
const ID_LIKE = /\d{5,}|^\*{2,}\d+$/;
const DATE_COLUMN_MAX_X = 30;
const DESCRIPTION_MIN_X = 100;
const REFERENCE_X = 315;
const COLUMN_TOLERANCE = 14;
const SKIPPED_DETAIL_PREFIXES = ["RFC:", "AUT:"];
const OWN_ACCOUNT_BANKS = /^SPEI (?:ENVIADO|RECIBIDO)\s*(?:NU MEXICO|NUBANK)\b/i;

interface Columns {
  chargesRight: number;
  creditsRight: number;
}

const wordsOf = (line: Line) => line.words.map((w) => w.text);

function findPhrase(tokens: string[], phrase: string[]): number {
  for (let i = 0; i + phrase.length <= tokens.length; i++) if (phrase.every((p, k) => tokens[i + k].toLowerCase() === p.toLowerCase())) return i + phrase.length;
  return -1;
}

function moneyAfter(lines: Line[], phrase: string[]): number | null {
  for (const line of lines) {
    const tokens = wordsOf(line);
    const end = findPhrase(tokens, phrase);
    if (end < 0) continue;
    const money = tokens.slice(end).find((t) => MONEY_PLAIN.test(t));
    if (money) return parseMoneyCents(money);
  }
  return null;
}

function countAfter(lines: Line[], phrase: string[]): number | null {
  for (const line of lines) {
    const tokens = wordsOf(line);
    const end = findPhrase(tokens, phrase);
    if (end < 0) continue;
    const count = tokens.slice(end).find((t) => /^\d+$/.test(t));
    if (count) return Number(count);
  }
  return null;
}

function dateOf(token: string, periodStart: string, periodEnd: string): string | null {
  const match = DATE_TOKEN.exec(token);
  const month = match ? monthNumber(match[2]) : null;
  return match && month ? inferDateInPeriod(Number(match[1]), month, periodStart, periodEnd) : null;
}

function describe(block: Line[]): string {
  const [first, ...detail] = block;
  const main = first.words.filter((w) => w.x0 >= DESCRIPTION_MIN_X && w.x0 < REFERENCE_X && !MONEY_PLAIN.test(w.text)).map((w) => w.text);
  const concept: string[] = [];
  for (const line of detail) {
    if (line.words[0].x0 < DESCRIPTION_MIN_X) continue;
    const left = line.words.filter((w) => w.x0 >= DESCRIPTION_MIN_X && w.x0 < REFERENCE_X).map((w) => w.text);
    if (left.length === 0 || SKIPPED_DETAIL_PREFIXES.includes(left[0].toUpperCase()) || left[0].toUpperCase().startsWith("MBAN")) continue;
    const identifierAt = left.findIndex((t) => ID_LIKE.test(t) || /^BNET$/i.test(t));
    if (identifierAt < 0) continue;
    const words = left.filter((t) => !ID_LIKE.test(t) && !/^BNET$/i.test(t));
    if (words.length > 0) concept.push(words.join(" "));
  }
  const spaced = main.join(" ").replace(/^(SPEI (?:RECIBIDO|ENVIADO))(?=\S)/i, "$1 ");
  return cleanDescription([spaced, concept.join(" ")].filter(Boolean).join(" – "));
}

export const bbvaDebitParser: StatementParser = {
  bank: "bbva_debito",

  detect(words) {
    const text = normalizeText(allText(words));
    return (text.includes("libreton basico cuenta digital") || text.includes("bbva")) && text.includes("detalle de movimientos realizados") && /\boper\b/.test(text) && /\bcargos\b/.test(text);
  },

  parse(words: PdfWord[]): ParsedStatement {
    const lines = groupIntoLines(words);
    const periodLine = lines.map((l) => PERIOD.exec(l.text)).find((m) => m);
    if (!periodLine) throw new StatementFormatError("No se encontró el periodo del estado de BBVA.");
    const periodStart = isoDate(Number(periodLine[3]), Number(periodLine[2]), Number(periodLine[1]));
    const periodEnd = isoDate(Number(periodLine[6]), Number(periodLine[5]), Number(periodLine[4]));

    const accountLine = lines.find((l) => /No\.\s+de\s+Cuenta/i.test(l.text) && !/Cliente/i.test(l.text));
    const accountDigits = accountLine?.words.map((w) => w.text.replace(/\D/g, "")).find((digits) => digits.length >= 8) ?? "";

    const headerLine = lines.find((l) => l.words.some((w) => w.text === "CARGOS") && l.words.some((w) => w.text === "ABONOS"));
    const chargesHeader = headerLine?.words.find((w) => w.text === "CARGOS");
    const creditsHeader = headerLine?.words.find((w) => w.text === "ABONOS");
    if (!chargesHeader || !creditsHeader) throw new StatementFormatError("No se encontraron las columnas de cargos y abonos.");
    const columns: Columns = { chargesRight: chargesHeader.x1, creditsRight: creditsHeader.x1 };

    const startIndex = lines.findIndex((l) => normalizeText(l.text).includes("detalle de movimientos realizados"));
    const endIndex = lines.findIndex((l) => /TOTAL IMPORTE CARGOS/i.test(l.text));
    if (startIndex < 0) throw new StatementFormatError("No se encontró el detalle de movimientos de BBVA.");
    const body = lines.slice(startIndex + 1, endIndex < 0 ? undefined : endIndex);

    const blocks: Line[][] = [];
    for (const line of body) {
      const first = line.words[0];
      if (first.x0 < DATE_COLUMN_MAX_X && DATE_TOKEN.test(first.text)) blocks.push([line]);
      else if (blocks.length > 0) blocks[blocks.length - 1].push(line);
    }

    const transactions: ParsedStatementTransaction[] = [];
    const warnings: string[] = [];
    for (const block of blocks) {
      const dateWords = block[0].words.filter((w) => w.x0 < DESCRIPTION_MIN_X && DATE_TOKEN.test(w.text));
      const date = dateOf(dateWords[0].text, periodStart, periodEnd);
      if (!date) throw new StatementFormatError(`Fecha de movimiento no reconocida: ${dateWords[0].text}`);
      const postedDate = dateWords[1] ? (dateOf(dateWords[1].text, periodStart, periodEnd) ?? undefined) : undefined;

      const amountWords = block.flatMap((l) => l.words).filter((w) => MONEY_PLAIN.test(w.text) && w.x1 <= columns.creditsRight + COLUMN_TOLERANCE && w.x0 >= columns.chargesRight - 55);
      const columnAmounts = amountWords.filter((w) => Math.min(Math.abs(w.x1 - columns.chargesRight), Math.abs(w.x1 - columns.creditsRight)) <= COLUMN_TOLERANCE);
      if (columnAmounts.length !== 1) throw new StatementFormatError(`No se pudo ubicar el monto de un movimiento del ${date} (columnas de cargos y abonos).`);
      const amountWord = columnAmounts[0];
      const isCharge = Math.abs(amountWord.x1 - columns.chargesRight) <= Math.abs(amountWord.x1 - columns.creditsRight);
      const cents = parseMoneyCents(amountWord.text);

      const balances = block
        .flatMap((l) => l.words)
        .filter((w) => MONEY_PLAIN.test(w.text) && w.x0 > columns.creditsRight + COLUMN_TOLERANCE)
        .sort((a, b) => a.x0 - b.x0);
      const description = describe(block);
      const transaction: ParsedStatementTransaction = {
        date,
        ...(postedDate ? { postedDate } : {}),
        description: description || "Movimiento BBVA",
        amountCents: isCharge ? -cents : cents,
        type: isCharge ? "expense" : "income",
        ...(balances.length > 0 ? { balanceAfterCents: parseMoneyCents(balances[0].text) } : {}),
      };
      if (OWN_ACCOUNT_BANKS.test(description)) transaction.suggestedType = "internal_transfer";
      transactions.push(transaction);
    }

    const summaryLines = lines.slice(0, startIndex);
    const opening = moneyAfter(summaryLines, ["Saldo", "Anterior"]);
    const closing = moneyAfter(summaryLines, ["Saldo", "Final"]);
    const creditsTotal = moneyAfter(summaryLines, ["Depósitos", "/", "Abonos", "(+)"]);
    const chargesTotal = moneyAfter(summaryLines, ["Retiros", "/", "Cargos", "(-)"]);
    const creditsCount = countAfter(summaryLines, ["Depósitos", "/", "Abonos", "(+)"]);
    const chargesCount = countAfter(summaryLines, ["Retiros", "/", "Cargos", "(-)"]);
    const totalLine = (pattern: RegExp) => lines.find((l) => pattern.test(l.text));
    const importCharges = totalLine(/TOTAL IMPORTE CARGOS/i);
    const importCredits = totalLine(/TOTAL IMPORTE ABONOS/i);
    const firstMoney = (line: Line | undefined) => line?.words.map((w) => w.text).find((t) => isMoneyToken(t));
    const lastInteger = (line: Line | undefined) => [...(line?.words ?? [])].reverse().find((w) => /^\d+$/.test(w.text))?.text;

    const actualCharges = sumCents(transactions.filter((t) => t.amountCents < 0).map((t) => -t.amountCents));
    const actualCredits = sumCents(transactions.filter((t) => t.amountCents > 0).map((t) => t.amountCents));
    const chargeCount = transactions.filter((t) => t.amountCents < 0).length;
    const creditCount = transactions.length - chargeCount;

    const expectedCharges = importCharges && firstMoney(importCharges) ? parseMoneyCents(firstMoney(importCharges) as string) : chargesTotal;
    const expectedCredits = importCredits && firstMoney(importCredits) ? parseMoneyCents(firstMoney(importCredits) as string) : creditsTotal;
    const expectedChargeCount = lastInteger(totalLine(/TOTAL MOVIMIENTOS CARGOS/i)) ? Number(lastInteger(totalLine(/TOTAL MOVIMIENTOS CARGOS/i))) : chargesCount;
    const expectedCreditCount = lastInteger(totalLine(/TOTAL MOVIMIENTOS ABONOS/i)) ? Number(lastInteger(totalLine(/TOTAL MOVIMIENTOS ABONOS/i))) : creditsCount;

    const checks = [
      ...(expectedCharges != null ? [{ label: "Total de cargos", expected: expectedCharges, actual: actualCharges, isMoney: true }] : []),
      ...(expectedCredits != null ? [{ label: "Total de abonos", expected: expectedCredits, actual: actualCredits, isMoney: true }] : []),
      ...(expectedChargeCount != null ? [{ label: "Número de cargos", expected: expectedChargeCount, actual: chargeCount, isMoney: false }] : []),
      ...(expectedCreditCount != null ? [{ label: "Número de abonos", expected: expectedCreditCount, actual: creditCount, isMoney: false }] : []),
      ...(opening != null && closing != null ? [{ label: "Saldo final = saldo anterior + abonos − cargos", expected: closing, actual: opening + actualCredits - actualCharges, isMoney: true }] : []),
    ];
    if (checks.length === 0) warnings.push("No se encontraron los totales del resumen para validar el estado.");
    if (transactions.length === 0) warnings.push("No se encontraron movimientos en el estado.");

    return {
      bank: "bbva_debito",
      accountLast4: accountDigits ? accountDigits.slice(-4) : null,
      periodStart,
      periodEnd,
      openingBalanceCents: opening,
      closingBalanceCents: closing,
      transactions,
      validation: buildValidation(checks),
      metadata: {},
      warnings,
    };
  },
};
