import assert from "node:assert/strict";
import { test } from "node:test";
import { bbvaDocument, nuCreditDocument, nuDebitDocument, type NuDebitDocument, type NuDebitMovement } from "../documents.testkit";
import { StatementFormatError } from "../types";
import { nuDebitParser } from "./nuDebit";

const DETAIL = ["Transferencia SPEI, Hora: 11:24:12, Enviado a STP. Al cliente Persona Ficticia (Dato no verificado", "por concepto Transferencia. A la cuenta 64000000000000033 clabe, Clave de", "rastreo NU3AIMSAH7UR84OPUVV4Q87P2J8M, Clave de referencia", "310826"];

const CAJITA_OUT: NuDebitMovement = { day: "31", month: "AGO", description: "Retiro de Cajita: emergencia", cents: 276_769 };
const CAJITA_IN: NuDebitMovement = { day: "31", month: "AGO", description: "Depósito en Cajita: emergencia", cents: -121_763 };

const BASE: NuDebitDocument = {
  period: "del 01 al 31 ago 2026",
  opening: 3_029_594,
  generated: 30_702,
  movements: [
    { day: "31", month: "AGO", description: "Persona Ficticia Transferencia", cents: -270_000, detail: DETAIL },
    CAJITA_OUT,
    CAJITA_IN,
    { day: "22", month: "AGO", description: "MARIA EJEMPLO Transferencia ropa", cents: 120_200, detail: ["Depósito SPEI, Hora: 20:21:39, Recibido de NUBANK.", "por concepto Transferencia ropa. De la cuenta", "63000000000000043 clabe, Clave de rastreo"] },
    { day: "22", month: "AGO", description: "12305 TIENDA GAL MERID Compra", cents: -120_200 },
    { day: "22", month: "AGO", description: "REST SUSHI ROLL MERIDA Compra", cents: -79_200 },
    { day: "21", month: "AGO", description: "Compensación de retraso SPEI", cents: 1 },
    { day: "20", month: "AGO", description: "Pago a tu tarjeta de crédito Nu", cents: -599_647, splitDate: true },
    { day: "20", month: "AGO", description: "Persona Ficticia Transferencia", cents: -50_000, splitDate: true, detail: DETAIL },
  ],
  cajitaSection: [
    { day: "31", month: "AGO", description: "Depósito en Cajita: emergencia", cents: -276_769 },
    { day: "31", month: "AGO", description: "Retiro de Cajita: emergencia", cents: 121_763 },
  ],
};

test("detecta un estado de Nu débito y rechaza los demás", () => {
  assert.equal(nuDebitParser.detect(nuDebitDocument(BASE)), true);
  assert.equal(nuDebitParser.detect(bbvaDocument({ period: ["05/07/2026", "04/08/2026"], opening: 0, movements: [] })), false);
  assert.equal(nuDebitParser.detect(nuCreditDocument({ period: "15 AGO 2026 al 14 SEP 2026", previousDebt: 0, rows: [] })), false);
});

test("lee periodo, últimos 4 dígitos de la cuenta y saldos del resumen", () => {
  const parsed = nuDebitParser.parse(nuDebitDocument(BASE));
  assert.deepEqual([parsed.periodStart, parsed.periodEnd, parsed.accountLast4], ["2026-08-01", "2026-08-31", "9786"]);
  assert.equal(parsed.openingBalanceCents, 3_029_594);
  assert.equal(parsed.validation.matches, true);
  assert.deepEqual(parsed.validation.checks.map((c) => c.label.split(" =")[0]), ["Depósitos", "Gastos", "Saldo al generar el estado"]);
});

test("el periodo puede cruzar de mes y usa el año del final", () => {
  const parsed = nuDebitParser.parse(nuDebitDocument({ ...BASE, period: "del 15 dic al 14 ene 2027", movements: [{ day: "28", month: "DIC", description: "Compra A", cents: -1_000 }, { day: "02", month: "ENE", description: "Compra B", cents: -2_000 }] }));
  assert.deepEqual([parsed.periodStart, parsed.periodEnd], ["2026-12-15", "2027-01-14"]);
  assert.deepEqual(parsed.transactions.filter((t) => !t.derived).map((t) => t.date), ["2026-12-28", "2027-01-02"]);
});

test("las líneas de Cajita son transferencias internas con el signo relativo a la cuenta, y no cuentan en depósitos ni gastos", () => {
  const cajitas = nuDebitParser.parse(nuDebitDocument(BASE)).transactions.filter((t) => t.type === "internal_transfer");
  assert.deepEqual(cajitas.map((t) => [t.description, t.amountCents]), [["Retiro de Cajita: emergencia", 276_769], ["Depósito en Cajita: emergencia", -121_763]]);
});

test("la sección de movimientos de cajitas, que repite lo mismo con el signo invertido, se ignora", () => {
  const parsed = nuDebitParser.parse(nuDebitDocument(BASE));
  assert.equal(parsed.transactions.filter((t) => t.type === "internal_transfer").length, 2);
});

test("el párrafo de detalle debajo de un movimiento no es un movimiento nuevo y no deja cuentas ni claves", () => {
  const parsed = nuDebitParser.parse(nuDebitDocument(BASE));
  assert.equal(parsed.transactions.filter((t) => !t.derived).length, 9);
  for (const t of parsed.transactions) assert.doesNotMatch(t.description, /clabe|rastreo|NU3A|Hora:|\d{9,}/i);
});

test("la fecha partida en dos líneas (día y mes arriba, año abajo) se lee completa", () => {
  const split = nuDebitParser.parse(nuDebitDocument(BASE)).transactions.filter((t) => t.date === "2026-08-20");
  assert.deepEqual(split.map((t) => t.amountCents), [-599_647, -50_000]);
});

test("el pago a la tarjeta de crédito Nu es card_payment; los depósitos e ingresos y gastos siguen su signo", () => {
  const byDescription = (text: string) => nuDebitParser.parse(nuDebitDocument(BASE)).transactions.find((t) => t.description.startsWith(text));
  assert.equal(byDescription("Pago a tu tarjeta")?.type, "card_payment");
  assert.equal(byDescription("MARIA EJEMPLO")?.type, "income");
  assert.equal(byDescription("REST SUSHI")?.type, "expense");
});

test("quita el sufijo 'Compra' de la descripción y conserva lo demás", () => {
  const descriptions = nuDebitParser.parse(nuDebitDocument(BASE)).transactions.map((t) => t.description);
  assert.ok(descriptions.includes("REST SUSHI ROLL MERIDA"));
  assert.ok(descriptions.includes("12305 TIENDA GAL MERID"));
  assert.ok(descriptions.includes("Persona Ficticia Transferencia"));
});

test("la compensación de retraso SPEI de un centavo se importa como ingreso normal", () => {
  const compensation = nuDebitParser.parse(nuDebitDocument(BASE)).transactions.find((t) => t.description.startsWith("Compensación"));
  assert.deepEqual([compensation?.amountCents, compensation?.type], [1, "income"]);
});

test("el interés del mes no es una línea del detalle: se ofrece como movimiento derivado con la fecha de fin del periodo", () => {
  const derived = nuDebitParser.parse(nuDebitDocument(BASE)).transactions.filter((t) => t.derived);
  assert.deepEqual(derived.map((t) => [t.date, t.amountCents, t.type]), [["2026-08-31", 30_702, "income"]]);
  assert.equal(nuDebitParser.parse(nuDebitDocument({ ...BASE, generated: 0 })).transactions.some((t) => t.derived), false);
});

test("si los depósitos no cuadran con el resumen lo reporta", () => {
  const parsed = nuDebitParser.parse(nuDebitDocument({ ...BASE, overrideDeposits: 1 }));
  assert.equal(parsed.validation.matches, false);
  assert.equal(parsed.validation.checks.find((c) => c.expected !== c.actual)?.label, "Depósitos");
});

test("un PDF de Nu sin periodo o sin detalle es un error de formato claro", () => {
  assert.throws(() => nuDebitParser.parse([]), StatementFormatError);
});
