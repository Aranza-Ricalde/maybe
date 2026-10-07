import type { PdfWord, StatementBank, StatementParser } from "../types";
import { bbvaDebitParser } from "./bbvaDebit";
import { nuCreditParser } from "./nuCredit";
import { nuDebitParser } from "./nuDebit";

export const STATEMENT_PARSERS: Record<StatementBank, StatementParser> = {
  nu_debito: nuDebitParser,
  nu_credito: nuCreditParser,
  bbva_debito: bbvaDebitParser,
};

export function detectStatementBank(words: PdfWord[]): StatementBank | null {
  const matches = Object.values(STATEMENT_PARSERS).filter((parser) => parser.detect(words));
  return matches.length === 1 ? matches[0].bank : null;
}
