import assert from "node:assert/strict";
import { test } from "node:test";
import { bbvaDocument, nuCreditDocument, nuDebitDocument, type NuCreditDocument } from "../documents.testkit";
import { StatementFormatError } from "../types";
import { nuCreditParser } from "./nuCredit";

const BASE: NuCreditDocument = {
  period: "15 AGO 2026 al 14 SEP 2026",
  previousDebt: 599_646,
  rows: [
    { operation: "15 AGO 2026", charge: "15 AGO 2026", description: "¡Grácias por tu pago!", signed: -599_647, subLines: ["Abono (con cuenta Nu)"] },
    { operation: "15 AGO 2026", charge: "16 AGO 2026", description: "Ubr* Pending.Uber.Com", signed: 5_995, subLines: ["Cambio (MXN 1 = $1.00)  MXN 59.95"] },
    { operation: "16 AGO 2026", charge: "16 AGO 2026", description: "Dlo*Didi Rides", signed: 9_700, subLines: ["Tarjeta virtual **** 7025"] },
    { operation: "17 AGO 2026", charge: "18 AGO 2026", description: "Compra Extranjera", signed: 17_500, subLines: ["Tarjeta virtual **** 7025", "Cambio (USD 1 = $17.50)  USD 10.00"] },
    { operation: "18 AGO 2026", charge: "19 AGO 2026", description: "Rest Merci Paseo", signed: 65_780 },
    { operation: "20 AGO 2026", charge: "20 AGO 2026", description: "Reembolso de tienda", signed: -2_500 },
  ],
};

test("detecta un estado de Nu crédito y rechaza los demás", () => {
  assert.equal(nuCreditParser.detect(nuCreditDocument(BASE)), true);
  assert.equal(nuCreditParser.detect(nuDebitDocument({ period: "del 01 al 31 ago 2026", opening: 0, movements: [] })), false);
  assert.equal(nuCreditParser.detect(bbvaDocument({ period: ["05/07/2026", "04/08/2026"], opening: 0, movements: [] })), false);
});

test("lee periodo y últimos 4 dígitos de la tarjeta (no los de la tarjeta virtual)", () => {
  const parsed = nuCreditParser.parse(nuCreditDocument(BASE));
  assert.deepEqual([parsed.periodStart, parsed.periodEnd, parsed.accountLast4], ["2026-08-15", "2026-09-14", "3195"]);
});

test("normaliza el signo: '+' es un cargo (gasto, negativo) y '-' un abono (positivo)", () => {
  const parsed = nuCreditParser.parse(nuCreditDocument(BASE));
  assert.deepEqual(parsed.transactions.map((t) => t.amountCents), [599_647, -5_995, -9_700, -17_500, -65_780, 2_500]);
});

test("fecha de operación como principal y fecha de cargo como postedDate", () => {
  const second = nuCreditParser.parse(nuCreditDocument(BASE)).transactions[1];
  assert.deepEqual([second.date, second.postedDate], ["2026-08-15", "2026-08-16"]);
});

test("quita el sufijo '| RFC: S.I.' y no toma las sublíneas como movimientos", () => {
  const parsed = nuCreditParser.parse(nuCreditDocument(BASE));
  assert.equal(parsed.transactions.length, 6);
  for (const t of parsed.transactions) assert.doesNotMatch(t.description, /RFC|Tarjeta virtual|Cambio|Abono \(con cuenta/);
});

test("el agradecimiento por el pago (aun con ortografía distinta) es card_payment; otros abonos son ingreso", () => {
  const types = nuCreditParser.parse(nuCreditDocument(BASE)).transactions.map((t) => t.type);
  assert.deepEqual(types, ["card_payment", "expense", "expense", "expense", "expense", "income"]);
});

test("guarda moneda y monto original solo cuando el tipo de cambio no es 1 MXN", () => {
  const parsed = nuCreditParser.parse(nuCreditDocument(BASE));
  assert.equal(parsed.transactions[1].foreign, undefined);
  assert.deepEqual(parsed.transactions[3].foreign, { currency: "USD", amountText: "10.00", exchangeRateText: "17.50" });
});

test("extrae los metadatos de la tarjeta sin tratarlos como movimientos", () => {
  const { metadata } = nuCreditParser.parse(nuCreditDocument(BASE));
  const toPay = 599_646 + (5_995 + 9_700 + 17_500 + 65_780) - (599_647 + 2_500);
  assert.deepEqual(metadata, { cutoffDate: "2026-09-14", dueDate: "2026-09-25", noInterestPaymentCents: toPay, minimumPaymentCents: 8_989, creditLimitCents: 600_000, availableCreditCents: 723 });
});

test("valida cargos, abonos y la ecuación del pago para no generar intereses", () => {
  const parsed = nuCreditParser.parse(nuCreditDocument(BASE));
  assert.equal(parsed.validation.matches, true);
  assert.equal(parsed.validation.checks.length, 3);
});

test("el saldo de apertura y cierre quedan como deuda (negativos)", () => {
  const parsed = nuCreditParser.parse(nuCreditDocument(BASE));
  assert.equal(parsed.openingBalanceCents, -599_646);
  assert.ok((parsed.closingBalanceCents ?? 0) < 0);
});

test("si el total de cargos no cuadra lo reporta con el nombre del total", () => {
  const parsed = nuCreditParser.parse(nuCreditDocument({ ...BASE, overrideCharges: 1 }));
  assert.equal(parsed.validation.matches, false);
  assert.equal(parsed.validation.checks.find((c) => c.expected !== c.actual)?.label, "Total de cargos");
});

test("si trae compras a meses que no sabe leer, avisa en lugar de ignorarlas en silencio", () => {
  assert.equal(nuCreditParser.parse(nuCreditDocument(BASE)).warnings.length, 0);
  const parsed = nuCreditParser.parse(nuCreditDocument({ ...BASE, deferredSection: true }));
  assert.match(parsed.warnings.join(" "), /compras a meses/i);
  assert.equal(parsed.transactions.length, 6);
});

test("un PDF de Nu crédito sin periodo es un error de formato claro", () => {
  assert.throws(() => nuCreditParser.parse([]), StatementFormatError);
});
