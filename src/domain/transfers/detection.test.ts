import assert from "node:assert/strict";
import { test } from "node:test";
import { detectTransferSuggestions, pairKey, type DetectionAccount, type DetectionTransaction } from "./detection";

const ACCOUNTS: DetectionAccount[] = [
  { id: 47, name: "Cuenta Nómina", type: "checking" },
  { id: 48, name: "Nu tdc", type: "credit_card" },
  { id: 49, name: "Openbank", type: "savings" },
  { id: 52, name: "Nu Débito", type: "checking" },
  { id: 42, name: "Deuda hey Banco", type: "other_liability" },
];

let nextId = 5000;
function tx(overrides: Partial<DetectionTransaction> & Pick<DetectionTransaction, "accountId" | "amountCents" | "name">): DetectionTransaction {
  return { id: nextId++, date: "2026-09-16", kind: "standard", categoryName: null, ...overrides };
}

function detect(transactions: DetectionTransaction[], extra: { rejectedPairs?: string[]; dismissed?: number[] } = {}) {
  return detectTransferSuggestions({
    transactions,
    accounts: ACCOUNTS,
    rejectedPairs: new Set(extra.rejectedPairs ?? []),
    dismissedTransactionIds: new Set(extra.dismissed ?? []),
  });
}

// Casos reales de tus datos (ids de producción).
const AHORRO_SALIDA = tx({ id: 715, accountId: 47, amountCents: -2_000_000, date: "2026-08-14", name: "Ahorro", categoryName: "Ahorro Emergencia" });
const AHORRO_ENTRADA = tx({ id: 928, accountId: 49, amountCents: 2_000_000, date: "2026-08-14", name: "Depósito a Apartado (vía Openbank)" });
const TDC_SALIDA = tx({ id: 1269, accountId: 52, amountCents: -599_300, name: "Pago tdc" });
const TDC_ENTRADA = tx({ id: 1224, accountId: 48, amountCents: 599_300, name: "Pago tdc" });
const NU_SALIDA = tx({ id: 1202, accountId: 47, amountCents: -600_000, name: "SPEI ENVIADO NU MEXICO - pago tdc" });
const NU_ENTRADA = tx({ id: 1268, accountId: 52, amountCents: 600_000, name: "Pago Nu transferencia recibida" });
const RENTA_MISMO_DIA = tx({ id: 1204, accountId: 47, amountCents: -600_000, name: "renta" });

test("un traspaso a tu cuenta de ahorro del mismo día se empareja con certeza: es transferencia", () => {
  const { pairs } = detect([AHORRO_SALIDA, AHORRO_ENTRADA]);
  assert.equal(pairs.length, 1);
  assert.deepEqual({ out: pairs[0].outflowId, in: pairs[0].inflowId, kind: pairs[0].kind, confidence: pairs[0].confidence }, { out: 715, in: 928, kind: "transfer", confidence: "strong" });
});

test("un pago a tu tarjeta de crédito se empareja con la entrada de la tarjeta y es un pago de tarjeta", () => {
  const { pairs } = detect([TDC_SALIDA, TDC_ENTRADA]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].kind, "cc_payment");
  assert.equal(pairs[0].confidence, "strong");
});

test("dos salidas iguales el mismo día: la que habla del pago se empareja y 'renta' queda fuera (no se liga a ciegas)", () => {
  const { pairs, singles } = detect([NU_SALIDA, NU_ENTRADA, RENTA_MISMO_DIA]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].outflowId, 1202);
  assert.equal(pairs[0].inflowId, 1268);
  assert.equal(pairs[0].confidence, "strong");
  assert.equal([...pairs.flatMap((p) => [p.outflowId, p.inflowId]), ...singles.map((s) => s.transactionId)].includes(1204), false);
});

test("sin la pista del pago, 'renta' contra una transferencia recibida solo queda como duda: nunca 'segura'", () => {
  const { pairs } = detect([NU_ENTRADA, RENTA_MISMO_DIA]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].confidence, "medium");
});

test("si dos contrapartes son igual de buenas, hay duda: se avisa de la alternativa y nunca es 'segura'", () => {
  const entrada = tx({ accountId: 52, amountCents: 100_000, name: "SPEI recibido" });
  const salidaA = tx({ accountId: 47, amountCents: -100_000, name: "Transferencia a Nu" });
  const salidaB = tx({ accountId: 49, amountCents: -100_000, name: "Transferencia a Nu" });
  const { pairs } = detect([entrada, salidaA, salidaB]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].confidence, "medium");
  assert.equal(pairs[0].alternativeIds.length, 1);
});

test("una salida de ahorro sin cuenta destino registrada se sugiere sola, como transferencia", () => {
  const { singles } = detect([tx({ id: 635, accountId: 47, amountCents: -6_000_000, name: "Ahorro emergencia → cuenta Nu (no rastreada en la app)", categoryName: "Ahorro Emergencia" })]);
  assert.equal(singles.length, 1);
  assert.deepEqual({ id: singles[0].transactionId, kind: singles[0].kind, confidence: singles[0].confidence }, { id: 635, kind: "transfer", confidence: "medium" });
});

test("un 'pago tdc' por SPEI sin contraparte se sugiere como pago de tarjeta", () => {
  const { singles } = detect([tx({ id: 1028, accountId: 47, amountCents: -69_900, name: "SPEI ENVIADO STP - pago tdc" })]);
  assert.equal(singles[0].kind, "cc_payment");
});

test("un SPEI a una institución con categoría de deuda se sugiere como pago de deuda", () => {
  const { singles } = detect([tx({ id: 1026, accountId: 47, amountCents: -855_800, name: "SPEI ENVIADO STP", categoryName: "Préstamos y deudas" })]);
  assert.equal(singles[0].kind, "loan_payment");
});

test("respeta la decisión del usuario: una categoría de gasto elegida a propósito nunca se discute", () => {
  const result = detect([tx({ accountId: 47, amountCents: -90_000, name: "SPEI salida (hogar)", categoryName: "Mantenimiento y reparaciones" })]);
  assert.equal(result.singles.length, 0);
  assert.equal(result.undecidedCount, 0);
});

test("un 'Transferencia' o 'SPEI' sin datos no se sugiere (no se adivina): solo se cuenta aparte, y el usuario lo marca desde su fila", () => {
  const result = detect([tx({ accountId: 47, amountCents: -600_000, name: "Transferencia" }), tx({ accountId: 47, amountCents: -200_000, name: "SPEI" })]);
  assert.equal(result.singles.length, 0);
  assert.equal(result.pairs.length, 0);
  assert.equal(result.undecidedCount, 2);
});

test("lo descartado no vuelve a sugerirse: ni el par rechazado ni el movimiento descartado", () => {
  const base = [AHORRO_SALIDA, AHORRO_ENTRADA];
  assert.equal(detect(base, { rejectedPairs: [pairKey(715, 928)] }).pairs.length, 0);
  const dismissed = detect(base, { dismissed: [715] });
  assert.equal(dismissed.pairs.length, 0);
  assert.equal(dismissed.singles.some((s) => s.transactionId === 715), false);
});

test("lo que ya es transferencia o pago de tarjeta no se vuelve a sugerir", () => {
  const result = detect([{ ...AHORRO_SALIDA, kind: "transfer" }, { ...AHORRO_ENTRADA, kind: "transfer" }]);
  assert.equal(result.pairs.length + result.singles.length, 0);
});

test("la misma cantidad con más de 3 días de diferencia no es una pareja", () => {
  const result = detect([tx({ accountId: 47, amountCents: -100_000, name: "Ahorro", date: "2026-09-01" }), tx({ accountId: 49, amountCents: 100_000, name: "Depósito a Apartado", date: "2026-09-08" })]);
  assert.equal(result.pairs.length, 0);
});

test("dos movimientos cualquiera con el mismo monto el mismo día, sin ninguna otra pista, no se sugieren", () => {
  const result = detect([tx({ accountId: 47, amountCents: -50_000, name: "Tacos" }), tx({ accountId: 52, amountCents: 50_000, name: "Cobro cliente" })]);
  assert.equal(result.pairs.length, 0);
});

test("un par donde alguno tiene una categoría de gasto elegida a propósito y sin pistas de transferencia no se sugiere", () => {
  const result = detect([tx({ accountId: 47, amountCents: -80_000, name: "Pago", categoryName: "Mantenimiento y reparaciones" }), tx({ accountId: 52, amountCents: 80_000, name: "Ingreso" })]);
  assert.equal(result.pairs.length, 0);
});

test("sin movimientos no revienta", () => {
  assert.deepEqual(detect([]), { pairs: [], singles: [], undecidedCount: 0 });
});

test("si AMBOS lados tienen una categoría elegida a propósito, no se sugiere (caso real: Gimnasio ↔ Otro ingreso)", () => {
  const result = detect([
    tx({ accountId: 52, amountCents: -49_000, date: "2026-08-17", name: "Jorge toraya Transferencia (a Mercado Pago)", categoryName: "Gimnasio y bienestar" }),
    tx({ accountId: 47, amountCents: 49_000, date: "2026-08-17", name: "SPEI recibido", categoryName: "Otro ingreso" }),
  ]);
  assert.equal(result.pairs.length, 0);
});

test("si solo uno de los lados tiene categoría elegida a propósito, puede sugerirse pero nunca como 'segura'", () => {
  const { pairs } = detect([
    tx({ accountId: 47, amountCents: -1_000_000, name: "Ahorro", categoryName: null }),
    tx({ accountId: 49, amountCents: 1_000_000, name: "Depósito a Apartado (vía Openbank)", categoryName: "Otro ingreso" }),
  ]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].confidence, "medium");
});

test("'F AHORRO' (Farmacia del Ahorro) no es un ahorro: la palabra suelta no basta", () => {
  const result = detect([tx({ accountId: 47, amountCents: -23_800, name: "F AHORRO MELA AMERICAS" })]);
  assert.equal(result.singles.length, 0);
});

test("un 'Ahorro' que empieza la descripción, o un apartado, sí es movimiento de ahorro", () => {
  assert.equal(detect([tx({ accountId: 47, amountCents: -1_180_000, name: "Ahorro", categoryName: "Ahorro Emergencia" })]).singles.length, 1);
  assert.equal(detect([tx({ accountId: 49, amountCents: 27_400, name: "Depósito a Apartado (vía Openbank)" })]).singles.length, 1);
  assert.equal(detect([tx({ accountId: 47, amountCents: -180_000, name: "SPEI ENVIADO STP - ahorro" })]).singles.length, 1);
});

test("'SPEI RECIBIDO NU MEXICO' no demuestra que sea tu cuenta (es el banco de quien envía): no se sugiere", () => {
  const result = detect([tx({ accountId: 47, amountCents: 230_000, name: "SPEI RECIBIDO NU MEXICO - Transferencia" })]);
  assert.equal(result.singles.length, 0);
  assert.equal(result.undecidedCount, 1);
});

test("un SPEI a una institución para pagar una deuda sí se sugiere como pago de deuda", () => {
  const { singles } = detect([tx({ accountId: 47, amountCents: -1_250_000, name: "SPEI ENVIADO NU MEXICO - FINIQUITO DEUDA" })]);
  assert.equal(singles.length, 1);
  assert.equal(singles[0].kind, "loan_payment");
});
