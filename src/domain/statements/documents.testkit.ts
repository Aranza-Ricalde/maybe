import { page, pages, type PageBuilder } from "./fixtures.testkit";
import type { PdfWord } from "./types";

export const money = (cents: number) => {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100).toLocaleString("en-US")}.${String(abs % 100).padStart(2, "0")}`;
};

export const signedMoney = (cents: number) => `${cents < 0 ? "-" : "+"}$${money(Math.abs(cents))}`;

export interface BbvaMovement {
  date: string;
  posted?: string;
  description: string;
  kind: "cargo" | "abono";
  cents: number;
  detail?: string[][];
  detailWithReference?: boolean;
  amountOffset?: number;
  balances?: [number, number];
  pageBreakAfter?: boolean;
}

export interface BbvaDocument {
  period: [start: string, end: string];
  opening: number;
  movements: BbvaMovement[];
  accountNumber?: string;
  overrideChargesTotal?: number;
  omitSummary?: boolean;
}

const CHARGES_RIGHT = 417;
const CREDITS_RIGHT = 458;

export function bbvaDocument(doc: BbvaDocument): PdfWord[] {
  const charges = doc.movements.filter((m) => m.kind === "cargo");
  const credits = doc.movements.filter((m) => m.kind === "abono");
  const chargeSum = charges.reduce((s, m) => s + m.cents, 0);
  const creditSum = credits.reduce((s, m) => s + m.cents, 0);
  const closing = doc.opening + creditSum - chargeSum;
  const [start, end] = doc.period;

  let current: PageBuilder = page(1);
  const built: PageBuilder[] = [current];
  current.line([510, "Estado"], [546, "de"], [562, "Cuenta"]).line([460, "Libretón"], [501, "Básico"], [533, "Cuenta"], [568, "Digital"]);
  current.line([319, "Periodo"], [481, "DEL"], [499, start], [542, "AL"], [555, end]);
  current.line([318, "No."], [333, "de"], [345, "Cuenta"], [550, doc.accountNumber ?? "0012345678"]);
  current.line([318, "No."], [333, "de"], [345, "Cliente"], [559, "99887766"]);
  if (!doc.omitSummary) {
    current.line([11, "Saldo"], [36, "Promedio"], [261, "6,625.29"], [308, "Saldo"], [334, "Anterior"], [542, money(doc.opening)]);
    current.line([11, "Días"], [31, "del"], [46, "Periodo"], [285, "31"], [308, "Depósitos"], [352, "/"], [358, "Abonos"], [392, "(+)"], [470, String(credits.length)], [542, money(creditSum)]);
    current.line([11, "Tasa"], [32, "Bruta"], [273, "0.000"], [309, "Retiros"], [340, "/"], [345, "Cargos"], [376, "(-)"], [465, String(charges.length)], [542, money(chargeSum)]);
    current.line([11, "Saldo"], [37, "Promedio"], [278, "0.00"], [308, "Saldo"], [334, "Final"], [555, money(closing)]);
  }
  current.line([9, "Detalle"], [47, "de"], [62, "Movimientos"], [130, "Realizados"]);
  current.line([39, "FECHA"], [519, "SALDO"]);
  current.line([21, "OPER"], [70, "LIQ"], [105, "DESCRIPCION"], [321, "REFERENCIA"], [386, "CARGOS"], [428, "ABONOS"], [469, "OPERACION"], [536, "LIQUIDACION"]);

  for (const movement of doc.movements) {
    current.line([15, movement.date], [59, movement.posted ?? movement.date], [107, movement.description]);
    current.rightAligned(movement.kind === "cargo" ? CHARGES_RIGHT : CREDITS_RIGHT, money(movement.cents), movement.amountOffset ?? 0);
    if (movement.balances) {
      current.rightAligned(528, money(movement.balances[0]), movement.amountOffset ?? 0);
      current.rightAligned(606, money(movement.balances[1]), movement.amountOffset ?? 0);
    }
    for (const cells of movement.detail ?? []) current.line(...cells.map((text, i): [number, string] => [i === 0 ? 106 : 319, text]));
    if (movement.pageBreakAfter) {
      current.line([15, "La GAT Real es el rendimiento que obtendría después de descontar la inflación estimada"]);
      current.line([15, "BBVA MEXICO, S.A., INSTITUCION DE BANCA MULTIPLE, GRUPO FINANCIERO BBVA MEXICO"]);
      current.line([499, "Estado"], [538, "de"], [554, "Cuenta"]);
      current.line([534, "PAGINA"], [563, "3"], [572, "/"], [580, "11"]);
      current = page(built.length + 1);
      built.push(current);
      current.line([499, "Estado"], [538, "de"], [554, "Cuenta"]);
    }
  }
  current.line([13, "TOTAL"], [60, "IMPORTE"], [110, "CARGOS"], [300, money(doc.overrideChargesTotal ?? chargeSum)], [380, "TOTAL"], [420, "MOVIMIENTOS"], [490, "CARGOS"], [560, String(charges.length)]);
  current.line([13, "TOTAL"], [60, "IMPORTE"], [110, "ABONOS"], [300, money(creditSum)], [380, "TOTAL"], [420, "MOVIMIENTOS"], [490, "ABONOS"], [560, String(credits.length)]);
  return pages(...built);
}

export interface NuDebitMovement {
  day: string;
  month: string;
  description: string;
  cents: number;
  splitDate?: boolean;
  detail?: string[];
}

export interface NuDebitDocument {
  period: string;
  opening: number;
  generated?: number;
  movements: NuDebitMovement[];
  cajitaSection?: NuDebitMovement[];
  accountNumber?: string;
  overrideDeposits?: number;
}

const isCajita = (m: NuDebitMovement) => /Cajita/i.test(m.description);

export function nuDebitDocument(doc: NuDebitDocument): PdfWord[] {
  const regular = doc.movements.filter((m) => !isCajita(m));
  const deposits = regular.filter((m) => m.cents > 0).reduce((s, m) => s + m.cents, 0);
  const expenses = regular.filter((m) => m.cents < 0).reduce((s, m) => s + m.cents, 0);
  const generated = doc.generated ?? 0;
  const closing = doc.opening + deposits + expenses + generated;

  const first = page(1);
  first.line([420, "Cuenta"], [450, "Nu:"], [470, doc.accountNumber ?? "0012349786"]);
  first.line([420, `Periodo: ${doc.period}`]);
  first.line([60, "Saldo"], [90, "inicial"], [470, `$${money(doc.opening)}`]);
  first.line([60, "Depósitos"], [470, `+$${money(doc.overrideDeposits ?? deposits)}`]);
  first.line([60, "Gastos"], [470, `-$${money(-expenses)}`]);
  first.line([60, "Comisiones cobradas por Nu"], [470, "$0.00"]);
  first.line([60, "Dinero generado este mes"], [470, `$${money(generated)}`]);
  first.line([60, "Saldo al generar este estado de cuenta"], [470, `$${money(closing)}`]);

  const second = page(2);
  second.line([60, "Gráfico Transaccional"]).line([60, "Saldo inicial"]).line([60, `$${money(doc.opening)}`]).line([60, "Depósitos"]).line([60, `+$${money(deposits)}`]);
  second.line([83, "Detalle"], [122, "de"], [137, "movimientos"], [196, "en"], [211, "tu"], [225, "cuenta"]);
  second.line([58, "FECHA"], [138, "DEL"], [158, "01"], [394, "MONTO"], [431, "EN"], [450, "PESOS"]);
  const writeMovement = (builder: PageBuilder, movement: NuDebitMovement) => {
    if (movement.splitDate) {
      builder.line([56, movement.day], [73, movement.month]);
      builder.line([136, movement.description], [486 - 6 * (signedMoney(movement.cents).length - 10), signedMoney(movement.cents)]);
      builder.line([56, "2026"]);
    } else {
      builder.line([56, movement.day], [73, movement.month], [95, "2026"], [136, movement.description], [486, signedMoney(movement.cents)]);
    }
    for (const text of movement.detail ?? []) builder.line([136, text]);
  };
  doc.movements.forEach((m) => writeMovement(second, m));
  if (doc.cajitaSection) {
    second.line([83, "Detalle"], [122, "de"], [137, "movimientos"], [196, "de"], [211, "tus"], [225, "cajitas"]);
    doc.cajitaSection.forEach((m) => writeMovement(second, m));
  }
  return pages(first, second);
}

export interface NuCreditRow {
  operation: string;
  charge: string;
  description: string;
  signed: number;
  subLines?: string[];
}

export interface NuCreditDocument {
  period: string;
  previousDebt: number;
  rows: NuCreditRow[];
  cardNumber?: string;
  overrideCharges?: number;
  deferredSection?: boolean;
}

export function nuCreditDocument(doc: NuCreditDocument): PdfWord[] {
  const chargeSum = doc.rows.filter((r) => r.signed > 0).reduce((s, r) => s + r.signed, 0);
  const creditSum = doc.rows.filter((r) => r.signed < 0).reduce((s, r) => s - r.signed, 0);
  const toPay = doc.previousDebt + chargeSum - creditSum;

  const first = page(1);
  first.line([308, "Periodo:"], [430, doc.period]);
  first.line([308, "Fecha de corte:"], [430, "14 SEP 2026"]);
  first.line([308, "Fecha límite de pago 1 :"], [400, "Viernes, 25 SEP 2026"]);
  first.line([53, "Producto:"], [91, "Tarjeta de Crédito Nu, Oro"], [308, "Pago para no generar intereses 2 :"]);
  first.lineOffset(4, [496, `$${money(toPay)}`]);
  first.line([53, "Número de tarjeta:"], [134, doc.cardNumber ?? "XXXX-XXXX-XXXX-3195"]);
  first.line([308, "Pago mínimo 4 :"]);
  first.lineOffset(4, [507, "$89.89"]);
  first.line([53, "Adeudo del periodo anterior"], [200, "="], [230, `$${money(doc.previousDebt)}`], [308, "Monto de intereses pagados en los"]);
  first.line([53, "Cargos regulares (no a meses)"], [200, "+"], [230, `$${money(chargeSum)}`]);
  first.line([53, "Monto de intereses 8"], [200, "+"], [230, "$0.00"]);
  first.line([53, "Pagos y abonos"], [200, "-"], [230, `$${money(creditSum)}`]);
  first.line([308, "Límite de crédito"], [500, "$6,000.00"]);
  first.line([308, "Crédito disponible"], [500, "$7.23"]);

  const table = page(2);
  table.line([100, "CARGOS, ABONOS Y COMPRAS REGULARES (NO A MESES)"]);
  table.line([100, "Tarjeta titular: Persona Ficticia"]);
  table.line([53, "Fecha de la"], [130, "Fecha de cargo"], [220, "Descripción del movimiento"], [500, "Monto"]);
  for (const row of doc.rows) {
    table.line([53, row.operation], [130, row.charge], [200, `${row.description} | RFC: S.I.`], [490, signedMoney(row.signed)]);
    for (const text of row.subLines ?? []) table.line([200, text]);
  }
  table.line([400, "Total de cargos"], [500, `+$${money(doc.overrideCharges ?? chargeSum)}`]);
  table.line([400, "Total de abonos"], [500, `-$${money(creditSum)}`]);
  if (doc.deferredSection) {
    table.line([100, "COMPRAS Y CARGOS DIFERIDOS A MESES SIN INTERESES"]);
    table.line([53, "10 AGO 2026"], [130, "10 AGO 2026"], [200, "Tienda Departamental 3 de 12"], [490, "+$500.00"]);
  }
  return pages(first, table);
}
