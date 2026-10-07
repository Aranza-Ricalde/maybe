import assert from "node:assert/strict";
import { test } from "node:test";
import { bbvaDocument, nuCreditDocument, nuDebitDocument } from "../documents.testkit";
import { STATEMENT_BANKS } from "../types";
import { STATEMENT_PARSERS, detectStatementBank } from "./index";

test("cada banco tiene su parser y cada parser reconoce solo su formato", () => {
  assert.deepEqual(Object.keys(STATEMENT_PARSERS).sort(), [...STATEMENT_BANKS].sort());
  assert.equal(detectStatementBank(bbvaDocument({ period: ["05/07/2026", "04/08/2026"], opening: 0, movements: [] })), "bbva_debito");
  assert.equal(detectStatementBank(nuDebitDocument({ period: "del 01 al 31 ago 2026", opening: 0, movements: [] })), "nu_debito");
  assert.equal(detectStatementBank(nuCreditDocument({ period: "15 AGO 2026 al 14 SEP 2026", previousDebt: 0, rows: [] })), "nu_credito");
});

test("un PDF que no parece ninguno de los tres no se detecta", () => {
  assert.equal(detectStatementBank([]), null);
  assert.equal(detectStatementBank([{ page: 1, x0: 0, x1: 10, top: 0, bottom: 9, text: "Factura" }]), null);
});
