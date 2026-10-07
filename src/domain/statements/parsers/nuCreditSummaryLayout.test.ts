import assert from "node:assert/strict";
import { test } from "node:test";
import { page, pages } from "../fixtures.testkit";
import { detectStatementBank } from "./index";
import { nuCreditParser } from "./nuCredit";

interface Row {
  day: string;
  month: string;
  category: string;
  description: string;
  amount: string;
  credit?: boolean;
}

function document(rows: Row[], summary: { opening: string; payments: string; purchases: string; credits: string; dispositions: string; total: string }) {
  const first = page(1)
    .line([116, "Este es tu estado de cuenta de febrero"])
    .line([118, "Periodo: 15 ENE 2026 - 14 FEB 2026 (31 días)"])
    .line([118, "Fecha de corte: 14 FEB 2026"])
    .line([118, "Fecha límite de pago: 04 MAR 2026"]);
  const second = page(2)
    .line([118, "TARJETA: 1234 •••• •••• 3195"])
    .line([38, "USO DE TU TARJETA DE CRÉDITO"], [420, "Límite de crédito $9,000"])
    .line([40, "RESUMEN DE TRANSACCIONES"])
    .line([95, "Saldo inicial del periodo (ENE 2026)"], [507, summary.opening])
    .line([95, "Pagos a tu tarjeta en el periodo"], [500, "-"], [510, summary.payments])
    .line([95, "Compras"], [510, summary.purchases])
    .line([95, "Abonos y devoluciones"], [525, summary.credits])
    .line([95, "Disposiciones de Saldo"], [504, summary.dispositions])
    .line([95, "Saldo total del periodo"], [507, summary.total]);
  const table = page(3).line([40, "TRANSACCIONES DE 15 ENE 2026 A 14 FEB 2026 (31 DÍAS)"]);
  for (const row of rows) {
    table.line([97, row.day], [115, row.month], [171, row.category], [262, row.description], ...(row.credit ? ([[496, "-"]] as Array<[number, string]>) : []), [505, row.amount]);
  }
  table.line([262, "Saldo final del periodo"], [505, summary.total]);
  return pages(first, second, table);
}

const ROWS: Row[] = [
  { day: "20", month: "ENE", category: "", description: "¡Muchas gracias! Pago a tu tarjeta de crédito", amount: "$1,000.00", credit: true },
  { day: "21", month: "ENE", category: "Restaurante", description: "Mercadopago *Taqueria", amount: "$250.00" },
  { day: "22", month: "ENE", category: "Servicio", description: "Va Y Ven Yucatan", amount: "$12.00" },
  { day: "25", month: "ENE", category: "Otros", description: "Disposición de saldo en Cuenta Nu", amount: "$1,400.00" },
  { day: "03", month: "FEB", category: "Ropa", description: "Devolución tienda", amount: "$30.00", credit: true },
];

const SUMMARY = { opening: "$1,000.00", payments: "$1,000.00", purchases: "$262.00", credits: "$30.00", dispositions: "$1,400.00", total: "$1,632.00" };

test("el formato nuevo de Nu crédito se detecta y lee periodo, tarjeta y movimientos con signo", () => {
  const words = document(ROWS, SUMMARY);
  assert.equal(detectStatementBank(words), "nu_credito");
  const statement = nuCreditParser.parse(words);
  assert.deepEqual([statement.periodStart, statement.periodEnd, statement.accountLast4], ["2026-01-15", "2026-02-14", "3195"]);
  assert.deepEqual(statement.transactions.map((t) => [t.date, t.amountCents, t.type]), [
    ["2026-01-20", 100_000, "card_payment"],
    ["2026-01-21", -25_000, "expense"],
    ["2026-01-22", -1_200, "expense"],
    ["2026-01-25", -140_000, "expense"],
    ["2026-02-03", 3_000, "income"],
  ]);
});

test("la disposición de saldo hacia la Cuenta Nu se sugiere como transferencia y los totales cuadran con el saldo total", () => {
  const statement = nuCreditParser.parse(document(ROWS, SUMMARY));
  assert.equal(statement.transactions[3].suggestedType, "internal_transfer");
  assert.ok(statement.validation.matches, JSON.stringify(statement.validation.checks));
  assert.equal(statement.openingBalanceCents, -100_000);
  assert.equal(statement.closingBalanceCents, -163_200);
  assert.ok(statement.warnings.some((w) => /disposición de saldo/i.test(w)));
});

test("si un total del resumen no coincide, la validación lo marca y no se oculta", () => {
  const statement = nuCreditParser.parse(document(ROWS, { ...SUMMARY, total: "$1,700.00" }));
  assert.equal(statement.validation.matches, false);
});

test("los montos con $ sin decimales se leen como pesos enteros y las filas sin fecha se ignoran", () => {
  const words = document([...ROWS, { day: "04", month: "FEB", category: "Otros", description: "Cargo entero", amount: "$5" }], { ...SUMMARY, purchases: "$267.00", total: "$1,637.00" });
  const statement = nuCreditParser.parse(words);
  assert.equal(statement.transactions.at(-1)?.amountCents, -500);
  assert.ok(statement.validation.matches);
});
