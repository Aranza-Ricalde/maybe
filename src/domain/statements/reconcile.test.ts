import assert from "node:assert/strict";
import { test } from "node:test";
import { reconcileStatement, type ExistingMovement, type OtherAccountMovement, type ReconciliationContext } from "./reconcile";
import type { ParsedStatement, ParsedStatementTransaction } from "./types";

const tx = (date: string, description: string, amountCents: number, extra: Partial<ParsedStatementTransaction> = {}): ParsedStatementTransaction => ({ date, description, amountCents, type: amountCents < 0 ? "expense" : "income", ...extra });
const statement = (transactions: ParsedStatementTransaction[]): ParsedStatement => ({
  bank: "bbva_debito",
  accountLast4: "1032",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-31",
  openingBalanceCents: 0,
  closingBalanceCents: 0,
  transactions,
  validation: { checks: [], matches: true },
  metadata: {},
  warnings: [],
});
let nextId = 1;
const manual = (date: string, name: string, amountCents: number, extra: Partial<ExistingMovement> = {}): ExistingMovement => ({ id: nextId++, date, postedDate: null, amountCents, name, rawDescription: null, importHash: null, source: "manual", categoryId: null, ...extra });
const context = (existing: ExistingMovement[] = [], extra: Partial<ReconciliationContext> = {}): ReconciliationContext => ({ existing, knownHashes: new Set(), otherAccounts: [], ...extra });
const hashesOf = (s: ParsedStatement) => s.transactions.map((_, i) => `h${i}`);
const run = (rows: ParsedStatementTransaction[], ctx: ReconciliationContext) => reconcileStatement(statement(rows), hashesOf(statement(rows)), ctx);

test("un manual con otra descripción y fecha +2 días del banco es un posible duplicado", () => {
  const preview = run([tx("2026-08-05", "REST SUSHI ROLL MERIDA", -79_200)], context([manual("2026-08-07", "tacos", -79_200)]));
  assert.equal(preview.rows[0].status, "probable_match");
  assert.equal(preview.rows[0].match?.dateDistance, 2);
  assert.equal(preview.rows[0].match?.confidence, "low");
  assert.deepEqual([preview.rows[0].selected, preview.rows[0].defaultAction], [false, "skip"]);
});

test("la similitud de descripción no es obligatoria: monto y fecha bastan, y sube la confianza", () => {
  const sameDaySimilar = run([tx("2026-08-05", "OXXO MONARCA MID", -6_700)], context([manual("2026-08-05", "oxxo", -6_700)]));
  const oneDayApart = run([tx("2026-08-05", "REST SUSHI", -6_700)], context([manual("2026-08-06", "tacos", -6_700)]));
  const sameDayDifferent = run([tx("2026-08-05", "REST SUSHI", -6_700)], context([manual("2026-08-05", "tacos", -6_700)]));
  assert.equal(sameDaySimilar.rows[0].match?.confidence, "high");
  assert.equal(oneDayApart.rows[0].match?.confidence, "medium");
  assert.equal(sameDayDifferent.rows[0].match?.confidence, "medium");
});

test("el monto debe coincidir exacto y con el mismo signo, y la fecha estar dentro de ±3 días", () => {
  assert.equal(run([tx("2026-08-05", "OXXO", -6_700)], context([manual("2026-08-05", "oxxo", -6_701)])).rows[0].status, "new");
  assert.equal(run([tx("2026-08-05", "OXXO", -6_700)], context([manual("2026-08-05", "oxxo", 6_700)])).rows[0].status, "new");
  assert.equal(run([tx("2026-08-05", "OXXO", -6_700)], context([manual("2026-08-09", "oxxo", -6_700)])).rows[0].status, "new");
  assert.equal(run([tx("2026-08-05", "OXXO", -6_700)], context([manual("2026-08-08", "oxxo", -6_700)])).rows[0].status, "probable_match");
});

test("también cuenta la fecha de liquidación del banco para acercarse a lo que registraste", () => {
  const preview = run([tx("2026-08-05", "OXXO", -6_700, { postedDate: "2026-08-10" })], context([manual("2026-08-11", "oxxo", -6_700)]));
  assert.equal(preview.rows[0].status, "probable_match");
  assert.equal(preview.rows[0].match?.dateDistance, 1);
});

test("tres cargos idénticos el mismo día con solo dos manuales: dos emparejados y uno nuevo", () => {
  const rows = [tx("2026-08-07", "VA Y VEN YUCATAN", -1_200), tx("2026-08-07", "VA Y VEN YUCATAN", -1_200), tx("2026-08-07", "VA Y VEN YUCATAN", -1_200)];
  const preview = run(rows, context([manual("2026-08-07", "camión", -1_200), manual("2026-08-07", "camión", -1_200)]));
  assert.deepEqual(preview.rows.map((r) => r.status), ["probable_match", "probable_match", "new"]);
  assert.equal(new Set(preview.rows.filter((r) => r.match).map((r) => r.match?.transactionId)).size, 2);
  assert.ok(preview.rows.filter((r) => r.match).every((r) => r.match?.confidence === "low"));
});

test("el emparejamiento es uno a uno y prefiere la fecha más cercana", () => {
  const near = manual("2026-08-05", "a", -5_000);
  const far = manual("2026-08-07", "b", -5_000);
  const preview = run([tx("2026-08-05", "X", -5_000)], context([far, near]));
  assert.equal(preview.rows[0].match?.transactionId, near.id);
  const two = run([tx("2026-08-05", "X", -5_000), tx("2026-08-05", "X", -5_000)], context([manual("2026-08-05", "a", -5_000)]));
  assert.deepEqual(two.rows.map((r) => r.status), ["probable_match", "new"]);
});

test("lo ya importado (misma llave) queda bloqueado y desmarcado, y un movimiento con llave no se empareja", () => {
  const imported = manual("2026-08-05", "OXXO", -6_700, { importHash: "h0", source: "statement_import" });
  const preview = run([tx("2026-08-05", "OXXO", -6_700), tx("2026-08-06", "OTRO", -6_700)], context([imported], { knownHashes: new Set(["h0"]) }));
  assert.deepEqual(preview.rows.map((r) => [r.status, r.locked, r.selected]), [["already_imported", true, false], ["new", false, true]]);
  assert.equal(preview.rows[1].match, null);
  assert.deepEqual(preview.counts, { new: 1, probableMatch: 0, alreadyImported: 1 });
});

test("los movimientos nuevos vienen marcados, excepto el derivado (rendimientos del mes)", () => {
  const preview = run([tx("2026-08-05", "OXXO", -6_700), tx("2026-08-31", "Dinero generado del mes", 30_702, { derived: true })], context());
  assert.deepEqual(preview.rows.map((r) => [r.selected, r.defaultAction]), [[true, "import"], [false, "skip"]]);
});

test("el rendimiento derivado se empareja con el que ya registraste por CSV", () => {
  const preview = run([tx("2026-08-31", "Dinero generado del mes", 30_702, { derived: true })], context([manual("2026-08-31", "Dinero generado del mes (interes Cajitas Nu)", 30_702, { source: "csv_import" })]));
  assert.equal(preview.rows[0].status, "probable_match");
  assert.equal(preview.rows[0].match?.confidence, "high");
});

test("reporte inverso: manuales del periodo sin contraparte en el estado, sin incluir los emparejados ni los de fuera del periodo", () => {
  const matched = manual("2026-08-05", "oxxo", -6_700);
  const orphan = manual("2026-08-12", "Gasolina", -45_000);
  const outside = manual("2026-09-02", "otro", -100);
  const alreadyLinked = manual("2026-08-15", "ya vinculado", -100, { importHash: "x" });
  const preview = run([tx("2026-08-05", "OXXO", -6_700)], context([matched, orphan, outside, alreadyLinked]));
  assert.deepEqual(preview.unmatchedExisting.map((e) => e.id), [orphan.id]);
});

test("un movimiento igual en otra cuenta solo avisa, nunca empareja", () => {
  const elsewhere: OtherAccountMovement = { id: 900, accountName: "Cuenta Nómina", date: "2026-08-06", amountCents: -6_700, kind: "standard", linkedTransfer: false };
  const preview = run([tx("2026-08-05", "OXXO", -6_700)], context([], { otherAccounts: [elsewhere] }));
  assert.equal(preview.rows[0].status, "new");
  assert.deepEqual(preview.rows[0].sameAmountElsewhere, [{ transactionId: 900, accountName: "Cuenta Nómina", date: "2026-08-06" }]);
});

test("pago de tarjeta: propone el par con el movimiento opuesto en otra cuenta (±2 días) como pago de tarjeta", () => {
  const credit: OtherAccountMovement = { id: 500, accountName: "Nu TDC", date: "2026-08-21", amountCents: 599_647, kind: "standard", linkedTransfer: false };
  const preview = run([tx("2026-08-20", "Pago a tu tarjeta de crédito Nu", -599_647, { type: "card_payment" })], context([], { otherAccounts: [credit] }));
  assert.deepEqual(preview.rows[0].pairSuggestion, { transactionId: 500, accountName: "Nu TDC", date: "2026-08-21", kind: "cc_payment" });
});

test("no propone par si la contraparte ya está enlazada, está lejos o el movimiento no parece transferencia", () => {
  const base: OtherAccountMovement = { id: 500, accountName: "Nu TDC", date: "2026-08-21", amountCents: 599_647, kind: "standard", linkedTransfer: false };
  const payment = tx("2026-08-20", "Pago a tu tarjeta", -599_647, { type: "card_payment" });
  assert.equal(run([payment], context([], { otherAccounts: [{ ...base, linkedTransfer: true }] })).rows[0].pairSuggestion, null);
  assert.equal(run([payment], context([], { otherAccounts: [{ ...base, date: "2026-08-25" }] })).rows[0].pairSuggestion, null);
  assert.equal(run([tx("2026-08-20", "OXXO", -599_647)], context([], { otherAccounts: [base] })).rows[0].pairSuggestion, null);
});

test("un SPEI marcado como posible transferencia propia también propone par, como transferencia", () => {
  const nu: OtherAccountMovement = { id: 700, accountName: "Nu Débito", date: "2026-08-08", amountCents: 50_000, kind: "standard", linkedTransfer: false };
  const preview = run([tx("2026-08-08", "SPEI ENVIADO NU MEXICO", -50_000, { suggestedType: "internal_transfer" })], context([], { otherAccounts: [nu] }));
  assert.equal(preview.rows[0].pairSuggestion?.kind, "transfer");
});

test("una contraparte no se ofrece a dos movimientos distintos", () => {
  const nu: OtherAccountMovement = { id: 700, accountName: "Nu Débito", date: "2026-08-08", amountCents: 50_000, kind: "standard", linkedTransfer: false };
  const rows = [tx("2026-08-08", "SPEI A", -50_000, { suggestedType: "internal_transfer" }), tx("2026-08-08", "SPEI B", -50_000, { suggestedType: "internal_transfer" })];
  assert.deepEqual(run(rows, context([], { otherAccounts: [nu] })).rows.map((r) => r.pairSuggestion?.transactionId ?? null), [700, null]);
});
