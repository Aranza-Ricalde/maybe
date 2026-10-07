import assert from "node:assert/strict";
import { test } from "node:test";
import { bbvaDocument, nuCreditDocument, nuDebitDocument, type BbvaDocument } from "../documents.testkit";
import { StatementFormatError } from "../types";
import { bbvaDebitParser } from "./bbvaDebit";

const BASE: BbvaDocument = {
  period: ["05/07/2026", "04/08/2026"],
  opening: 100_000,
  movements: [
    { date: "05/JUL", description: "SPEI ENVIADO Mercado Pago", kind: "cargo", cents: 10_000, detail: [["4455667788", "Referencia", "0011223344", "722"], ["2206260mercadopago"], ["Juan Perez"]] },
    { date: "05/JUL", description: "SPEI ENVIADO Mercado Pago", kind: "cargo", cents: 4_800, detail: [["4455667799 garrafones", "Referencia", "0011223355"], ["22062601234567"], ["Maria Lopez"]] },
    { date: "06/JUL", posted: "05/JUL", description: "OXXO MONARCA MID", kind: "cargo", cents: 6_700, balances: [1_654_821, 1_395_033], detail: [["RFC: CCO8605231N4 14:23 AUT: 760773", "Referencia", "******5915"]], pageBreakAfter: true },
    { date: "07/JUL", description: "PAGO DE NOMINA", kind: "abono", cents: 2_039_735, amountOffset: 6, detail: [["EMPRESA FICTICIA SA DE CV", "Referencia", "BC12345678"]] },
    { date: "07/JUL", description: "VA Y VEN YUCATAN", kind: "cargo", cents: 1_200 },
    { date: "07/JUL", description: "VA Y VEN YUCATAN", kind: "cargo", cents: 1_200 },
    { date: "08/JUL", description: "SPEI ENVIADO NU MEXICO", kind: "cargo", cents: 50_000, detail: [["9988776655 traspaso", "Referencia", "0011"]] },
  ],
};

test("detecta un estado de BBVA y rechaza los de Nu", () => {
  assert.equal(bbvaDebitParser.detect(bbvaDocument(BASE)), true);
  assert.equal(bbvaDebitParser.detect(nuDebitDocument({ period: "del 01 al 31 ago 2026", opening: 0, movements: [] })), false);
  assert.equal(bbvaDebitParser.detect(nuCreditDocument({ period: "15 AGO 2026 al 14 SEP 2026", previousDebt: 0, rows: [] })), false);
});

test("lee periodo, últimos 4 dígitos y saldos del resumen, y valida todos los totales", () => {
  const parsed = bbvaDebitParser.parse(bbvaDocument(BASE));
  assert.deepEqual([parsed.periodStart, parsed.periodEnd, parsed.accountLast4], ["2026-07-05", "2026-08-04", "5678"]);
  assert.equal(parsed.openingBalanceCents, 100_000);
  assert.equal(parsed.closingBalanceCents, 100_000 + 2_039_735 - (10_000 + 4_800 + 6_700 + 1_200 + 1_200 + 50_000));
  assert.equal(parsed.validation.matches, true);
  assert.deepEqual(parsed.validation.checks.map((c) => c.label), ["Total de cargos", "Total de abonos", "Número de cargos", "Número de abonos", "Saldo final = saldo anterior + abonos − cargos"]);
  assert.deepEqual(parsed.warnings, []);
});

test("el signo sale de la columna (cargos vs abonos) aunque el monto no traiga signo", () => {
  const parsed = bbvaDebitParser.parse(bbvaDocument(BASE));
  const payroll = parsed.transactions.find((t) => t.description === "PAGO DE NOMINA");
  assert.deepEqual([payroll?.amountCents, payroll?.type], [2_039_735, "income"]);
  assert.deepEqual(parsed.transactions.filter((t) => t.amountCents < 0).map((t) => t.type), Array(6).fill("expense"));
});

test("un monto que cae unos puntos debajo de su fila se sigue asignando al movimiento correcto", () => {
  const parsed = bbvaDebitParser.parse(bbvaDocument(BASE));
  assert.equal(parsed.transactions.filter((t) => t.description === "PAGO DE NOMINA").length, 1);
  assert.equal(parsed.transactions.length, 7);
});

test("la descripción es la primera línea más el concepto; RFC, AUT, referencias, cuentas y beneficiario se descartan", () => {
  const descriptions = bbvaDebitParser.parse(bbvaDocument(BASE)).transactions.map((t) => t.description);
  assert.deepEqual(descriptions, [
    "SPEI ENVIADO Mercado Pago",
    "SPEI ENVIADO Mercado Pago – garrafones",
    "OXXO MONARCA MID",
    "PAGO DE NOMINA",
    "VA Y VEN YUCATAN",
    "VA Y VEN YUCATAN",
    "SPEI ENVIADO NU MEXICO – traspaso",
  ]);
  for (const description of descriptions) assert.doesNotMatch(description, /Juan|Maria|RFC|AUT|Referencia|\d{6,}/);
});

test("el pie y el encabezado de página no se cuelan como detalle del último movimiento", () => {
  const descriptions = bbvaDebitParser.parse(bbvaDocument(BASE)).transactions.map((t) => t.description).join(" ");
  assert.doesNotMatch(descriptions, /GAT|BBVA MEXICO|INSTITUCION|Estado de Cuenta|PAGINA/i);
});

test("fecha de operación y de liquidación: si no traen año se infieren del periodo", () => {
  const oxxo = bbvaDebitParser.parse(bbvaDocument(BASE)).transactions.find((t) => t.description === "OXXO MONARCA MID");
  assert.deepEqual([oxxo?.date, oxxo?.postedDate], ["2026-07-06", "2026-07-05"]);
});

test("los saldos por fila, cuando aparecen, se guardan como verificación", () => {
  const oxxo = bbvaDebitParser.parse(bbvaDocument(BASE)).transactions.find((t) => t.description === "OXXO MONARCA MID");
  assert.equal(oxxo?.balanceAfterCents, 1_654_821);
});

test("movimientos idénticos el mismo día se conservan como movimientos distintos", () => {
  const sameDay = bbvaDebitParser.parse(bbvaDocument(BASE)).transactions.filter((t) => t.description === "VA Y VEN YUCATAN");
  assert.equal(sameDay.length, 2);
  assert.deepEqual(sameDay.map((t) => t.amountCents), [-1_200, -1_200]);
});

test("un SPEI a Nu México se marca como posible transferencia propia, editable, sin cambiar su tipo", () => {
  const nu = bbvaDebitParser.parse(bbvaDocument(BASE)).transactions.find((t) => t.description.startsWith("SPEI ENVIADO NU MEXICO"));
  assert.deepEqual([nu?.type, nu?.suggestedType], ["expense", "internal_transfer"]);
  assert.equal(bbvaDebitParser.parse(bbvaDocument(BASE)).transactions.filter((t) => t.suggestedType).length, 1);
});

test("el cruce de año: diciembre y enero se ubican en el año correcto", () => {
  const parsed = bbvaDebitParser.parse(
    bbvaDocument({
      period: ["05/12/2026", "04/01/2027"],
      opening: 50_000,
      movements: [
        { date: "28/DIC", description: "COMPRA A", kind: "cargo", cents: 1_000 },
        { date: "02/ENE", posted: "30/DIC", description: "COMPRA B", kind: "cargo", cents: 2_000 },
      ],
    }),
  );
  assert.deepEqual(parsed.transactions.map((t) => [t.date, t.postedDate]), [["2026-12-28", "2026-12-28"], ["2027-01-02", "2026-12-30"]]);
  assert.equal(parsed.validation.matches, true);
});

test("si los totales no cuadran lo reporta con el nombre del total y la diferencia, sin lanzar error", () => {
  const parsed = bbvaDebitParser.parse(bbvaDocument({ ...BASE, overrideChargesTotal: 99_999 }));
  assert.equal(parsed.validation.matches, false);
  const failing = parsed.validation.checks.find((c) => c.expected !== c.actual);
  assert.deepEqual([failing?.label, failing?.expected], ["Total de cargos", 99_999]);
});

test("sin resumen avisa que no pudo validar", () => {
  const parsed = bbvaDebitParser.parse(bbvaDocument({ ...BASE, omitSummary: true }));
  assert.equal(parsed.transactions.length, 7);
  assert.equal(parsed.validation.matches, true);
});

test("un PDF de BBVA sin periodo es un error de formato claro", () => {
  assert.throws(() => bbvaDebitParser.parse([]), StatementFormatError);
});
