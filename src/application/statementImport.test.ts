import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import type { FamilyOwnership } from "@/domain/auth/ownership";
import type { CategoryClassifier } from "@/domain/captures/ports";
import type { LedgerOperations } from "@/domain/ledger/ports";
import { bbvaDocument, nuCreditDocument, nuDebitDocument, type BbvaMovement } from "@/domain/statements/documents.testkit";
import { bbvaDebitParser } from "@/domain/statements/parsers/bbvaDebit";
import { nuCreditParser } from "@/domain/statements/parsers/nuCredit";
import { nuDebitParser } from "@/domain/statements/parsers/nuDebit";
import type { PdfTextExtractor } from "@/domain/statements/ports";
import { BankMismatchError, InvalidStatementDecisionError, StatementAccountError, StatementAlreadyImportedError, StatementFormatError, StatementTotalsMismatchError, type ParsedStatement, type PdfWord } from "@/domain/statements/types";
import { ConfirmStatementImportUseCase, type ConfirmStatementInput, type RowDecision } from "./confirmStatementImport";
import { EnrichImportedTransactionsUseCase } from "./enrichImportedTransactions";
import { FakeStatementWorld, identityHasher } from "./fakeStatements.testkit";
import { ParseStatementUseCase } from "./parseStatement";
import { ReconcileStatementUseCase } from "./reconcileStatement";
import { StatementImportCancelledError } from "@/domain/statements/importControl";
import { UndoStatementImportUseCase } from "./undoStatementImport";
import { UpdateTransactionUseCase } from "./updateTransaction";

const FAMILY = 1;
const BBVA_ACCOUNT = 1;
const DEBIT_ACCOUNT = 2;
const CREDIT_ACCOUNT = 3;

function setup() {
  const world = new FakeStatementWorld().addNamedAccount(BBVA_ACCOUNT, "BBVA").addNamedAccount(DEBIT_ACCOUNT, "Nu Débito").addNamedAccount(CREDIT_ACCOUNT, "Nu TDC").addNamedAccount(9, "Ajena", { familyId: 2 }).addNamedAccount(8, "Archivada", { isActive: false });
  const ownership: FamilyOwnership = { owns: async (resource, id) => resource === "category" && [10, 11].includes(id), ownsAllAccounts: async () => true };
  const reconcile = new ReconcileStatementUseCase(world.contextRepository(), identityHasher);
  const confirm = new ConfirmStatementImportUseCase(reconcile, world, ownership);
  const run = (accountId: number, statement: ParsedStatement, decisions: RowDecision[] = [], extra: Partial<ConfirmStatementInput> = {}) => confirm.execute({ familyId: FAMILY, accountId, statement, decisions, acknowledgeMismatch: false, ...extra });
  return { world, reconcile, confirm, run, ownership };
}

const bbva = (period: [string, string], movements: BbvaMovement[], opening = 100_000) => bbvaDebitParser.parse(bbvaDocument({ period, opening, movements }));
const AUGUST: BbvaMovement[] = [
  { date: "05/AGO", description: "OXXO MONARCA MID", kind: "cargo", cents: 6_700 },
  { date: "06/AGO", description: "VA Y VEN YUCATAN", kind: "cargo", cents: 1_200 },
  { date: "06/AGO", description: "VA Y VEN YUCATAN", kind: "cargo", cents: 1_200 },
  { date: "14/AGO", description: "PAGO DE NOMINA", kind: "abono", cents: 2_039_735 },
];
const SEPTEMBER: BbvaMovement[] = [
  { date: "05/SEP", description: "OXXO MONARCA MID", kind: "cargo", cents: 6_700 },
  { date: "06/SEP", description: "VA Y VEN YUCATAN", kind: "cargo", cents: 1_200 },
  { date: "14/SEP", description: "PAGO DE NOMINA", kind: "abono", cents: 2_039_735 },
];

test("importar un estado crea los movimientos con origen, hash, fecha de liquidación y conciliado, y mueve el saldo una sola vez", async () => {
  const { world, run } = setup();
  const statement = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  const result = await run(BBVA_ACCOUNT, statement);

  assert.deepEqual([result.imported, result.linked, result.skipped, result.paired], [4, 0, 0, 0]);
  const created = [...world.transactions.values()];
  assert.equal(created.length, 4);
  assert.ok(created.every((t) => t.source === "statement_import" && t.reconciled === true && t.importHash && t.importId === result.importId));
  assert.equal(world.balanceOf(BBVA_ACCOUNT), 2_039_735 - 6_700 - 1_200 - 1_200);
  assert.deepEqual(world.storedImports.map((i) => [i.bank, i.accountId, i.accountLast4, i.periodStart, i.periodEnd, i.transactionCount, i.linkedCount]), [["bbva_debito", BBVA_ACCOUNT, "5678", "2026-08-05", "2026-09-04", 4, 0]]);
});

test("re-subir el mismo estado: todo queda como ya importado y bloqueado, y no se duplica nada", async () => {
  const { world, reconcile, run } = setup();
  const statement = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  await run(BBVA_ACCOUNT, statement);
  const again = await reconcile.execute(FAMILY, BBVA_ACCOUNT, statement);

  assert.deepEqual(again.rows.map((r) => [r.status, r.locked, r.selected]), Array(4).fill(["already_imported", true, false]));
  const second = await run(BBVA_ACCOUNT, statement, again.rows.map((r) => ({ index: r.index, action: "import" as const })));
  assert.deepEqual([second.imported, second.linked], [0, 0]);
  assert.equal(world.transactions.size, 4);
});

test("estados en orden inverso al cronológico no generan duplicados, y re-subir cualquiera de los dos los reconoce", async () => {
  const { world, reconcile, run } = setup();
  const august = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  const september = bbva(["05/09/2026", "04/10/2026"], SEPTEMBER);
  await run(BBVA_ACCOUNT, september);
  await run(BBVA_ACCOUNT, august);

  assert.equal(world.transactions.size, 7);
  assert.equal(new Set([...world.transactions.values()].map((t) => t.importHash)).size, 7);
  for (const statement of [august, september]) assert.ok((await reconcile.execute(FAMILY, BBVA_ACCOUNT, statement)).rows.every((r) => r.status === "already_imported"));
});

test("un manual con descripción distinta y fecha +2 días es posible duplicado; vincular no crea movimiento ni pisa categoría, notas ni nombre", async () => {
  const { world, reconcile, run } = setup();
  const manual = world.addManual({ accountId: BBVA_ACCOUNT, date: "2026-08-07", amountCents: -6_700, name: "tacos del centro", categoryId: 10, notes: "con Ana" });
  const statement = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  const preview = await reconcile.execute(FAMILY, BBVA_ACCOUNT, statement);
  const row = preview.rows[0];
  assert.deepEqual([row.status, row.match?.transactionId, row.match?.confidence], ["probable_match", manual.id, "low"]);

  const balanceBefore = world.balanceOf(BBVA_ACCOUNT);
  const result = await run(BBVA_ACCOUNT, statement, [{ index: 0, action: "link" }, ...preview.rows.slice(1).map((r) => ({ index: r.index, action: "import" as const }))]);
  const linked = world.transactions.get(manual.id)!;
  assert.deepEqual([linked.name, linked.categoryId, linked.notes, linked.date, linked.amountCents], ["tacos del centro", 10, "con Ana", "2026-08-07", -6_700]);
  assert.deepEqual([linked.importHash, linked.reconciled, linked.postedDate], [row.hash, true, "2026-08-05"]);
  assert.deepEqual([result.imported, result.linked], [3, 1]);
  assert.equal(world.transactions.size, 4);
  assert.equal(world.balanceOf(BBVA_ACCOUNT), balanceBefore + 2_039_735 - 1_200 - 1_200);

  const again = await reconcile.execute(FAMILY, BBVA_ACCOUNT, statement);
  assert.equal(again.rows[0].status, "already_imported");
});

test("por defecto los posibles duplicados se omiten: no se importan ni se vinculan", async () => {
  const { world, run } = setup();
  world.addManual({ accountId: BBVA_ACCOUNT, date: "2026-08-05", amountCents: -6_700, name: "oxxo" });
  const result = await run(BBVA_ACCOUNT, bbva(["05/08/2026", "04/09/2026"], AUGUST));
  assert.deepEqual([result.imported, result.linked, result.skipped], [3, 0, 1]);
  assert.equal(world.transactions.size, 4);
  assert.equal([...world.transactions.values()].find((t) => t.name === "oxxo")?.importHash, undefined);
});

test("'importar como nuevo' un probable duplicado sí crea el movimiento", async () => {
  const { world, run } = setup();
  world.addManual({ accountId: BBVA_ACCOUNT, date: "2026-08-05", amountCents: -6_700, name: "oxxo" });
  const result = await run(BBVA_ACCOUNT, bbva(["05/08/2026", "04/09/2026"], AUGUST), [{ index: 0, action: "import" }]);
  assert.equal(result.imported, 4);
  assert.equal(world.transactions.size, 5);
});

test("tres cargos de $12 el mismo día con solo dos manuales: dos candidatos a vincular y uno nuevo", async () => {
  const { world, reconcile } = setup();
  world.addManual({ accountId: BBVA_ACCOUNT, date: "2026-08-06", amountCents: -1_200, name: "camión" });
  world.addManual({ accountId: BBVA_ACCOUNT, date: "2026-08-06", amountCents: -1_200, name: "camión" });
  const statement = bbva(["05/08/2026", "04/09/2026"], [...AUGUST, { date: "06/AGO", description: "VA Y VEN YUCATAN", kind: "cargo", cents: 1_200 }]);
  const preview = await reconcile.execute(FAMILY, BBVA_ACCOUNT, statement);
  assert.deepEqual(preview.rows.filter((r) => r.transaction.amountCents === -1_200).map((r) => r.status), ["probable_match", "probable_match", "new"]);
});

test("los saldos agregados reflejan solo lo importado: gastos e ingresos del mes salen del estado", async () => {
  const { world, run } = setup();
  await run(BBVA_ACCOUNT, bbva(["05/08/2026", "04/09/2026"], AUGUST));
  assert.deepEqual(world.monthTotals("2026-08-01"), { income: 2_039_735, expense: -9_100 });
});

test("pago de tarjeta en dos estados: se propone el par y al confirmarlo ninguno cuenta como gasto ni ingreso", async () => {
  const { world, reconcile, run } = setup();
  const credit = nuCreditParser.parse(nuCreditDocument({ period: "15 AGO 2026 al 14 SEP 2026", previousDebt: 599_647, rows: [{ operation: "20 AGO 2026", charge: "20 AGO 2026", description: "¡Gracias por tu pago!", signed: -599_647, subLines: ["Abono (con cuenta Nu)"] }, { operation: "21 AGO 2026", charge: "21 AGO 2026", description: "Tienda Uno", signed: 10_000 }] }));
  await run(CREDIT_ACCOUNT, credit);
  const creditPayment = [...world.transactions.values()].find((t) => t.accountId === CREDIT_ACCOUNT && t.amountCents === 599_647)!;

  const debit = nuDebitParser.parse(nuDebitDocument({ period: "del 01 al 31 ago 2026", opening: 1_000_000, movements: [{ day: "20", month: "AGO", description: "Pago a tu tarjeta de crédito Nu", cents: -599_647 }] }));
  const preview = await reconcile.execute(FAMILY, DEBIT_ACCOUNT, debit);
  assert.deepEqual(preview.rows[0].pairSuggestion, { transactionId: creditPayment.id, accountName: "Nu TDC", date: "2026-08-20", kind: "cc_payment" });

  const result = await run(DEBIT_ACCOUNT, debit, [{ index: 0, action: "import", pairWithTransactionId: creditPayment.id }]);
  assert.equal(result.paired, 1);
  const debitPayment = [...world.transactions.values()].find((t) => t.accountId === DEBIT_ACCOUNT)!;
  assert.deepEqual([debitPayment.kind, world.transactions.get(creditPayment.id)?.kind], ["cc_payment", "cc_payment"]);
  assert.deepEqual(world.transfers, [[debitPayment.id, creditPayment.id]]);
  assert.deepEqual(world.monthTotals("2026-08-01"), { income: 0, expense: -10_000 });
});

test("emparejar con un movimiento manual que ya contaba como gasto lo reclasifica y retira ese gasto de los totales", async () => {
  const { world, reconcile, ownership } = setup();
  const manualOut = world.addManual({ accountId: BBVA_ACCOUNT, date: "2026-08-08", amountCents: -50_000, name: "traspaso a Nu" });
  await world.applyIncomeExpenseMonthlyDelta(FAMILY, "2026-08-01", 0, -50_000);
  const debit = nuDebitParser.parse(nuDebitDocument({ period: "del 01 al 31 ago 2026", opening: 0, movements: [{ day: "08", month: "AGO", description: "BBVA MEXICO Transferencia", cents: 50_000 }] }));
  const statement: ParsedStatement = { ...debit, transactions: [{ ...debit.transactions[0], type: "internal_transfer" }] };

  const preview = await reconcile.execute(FAMILY, DEBIT_ACCOUNT, statement);
  assert.equal(preview.rows[0].pairSuggestion?.transactionId, manualOut.id);

  const confirm = new ConfirmStatementImportUseCase(reconcile, world, ownership);
  const result = await confirm.execute({ familyId: FAMILY, accountId: DEBIT_ACCOUNT, statement, decisions: [{ index: 0, action: "import", pairWithTransactionId: manualOut.id }], acknowledgeMismatch: true });
  assert.equal(result.paired, 1);
  assert.equal(world.transactions.get(manualOut.id)?.kind, "transfer");
  assert.deepEqual(world.monthTotals("2026-08-01"), { income: 0, expense: 0 });
});

test("el movimiento marcado por error como par con otro que no es su sugerencia se rechaza y no cambia nada", async () => {
  const { world, run } = setup();
  const credit = nuCreditParser.parse(nuCreditDocument({ period: "15 AGO 2026 al 14 SEP 2026", previousDebt: 599_647, rows: [{ operation: "20 AGO 2026", charge: "20 AGO 2026", description: "¡Gracias por tu pago!", signed: -599_647 }] }));
  const debit = nuDebitParser.parse(nuDebitDocument({ period: "del 01 al 31 ago 2026", opening: 1_000_000, movements: [{ day: "20", month: "AGO", description: "Pago a tu tarjeta de crédito Nu", cents: -599_647 }] }));
  await run(CREDIT_ACCOUNT, credit);
  const before = world.transactions.size;
  await assert.rejects(run(DEBIT_ACCOUNT, debit, [{ index: 0, action: "import", pairWithTransactionId: 12345 }]), InvalidStatementDecisionError);
  assert.equal(world.transactions.size, before);
});

test("la confirmación es atómica: si falla a la mitad no queda ningún movimiento, saldo, total ni registro de importación", async () => {
  const { world, run } = setup();
  const original = world.insertTransaction.bind(world);
  let calls = 0;
  world.insertTransaction = async (input) => {
    if (++calls === 3) throw new Error("falla simulada de la base");
    return original(input);
  };
  await assert.rejects(run(BBVA_ACCOUNT, bbva(["05/08/2026", "04/09/2026"], AUGUST)), /falla simulada/);
  assert.equal(world.transactions.size, 0);
  assert.equal(world.balanceOf(BBVA_ACCOUNT), 0);
  assert.deepEqual(world.monthTotals("2026-08-01"), { income: 0, expense: 0 });
  assert.equal(world.storedImports.length, 0);
});

test("si los totales no cuadran, solo se importa con confirmación explícita", async () => {
  const { run } = setup();
  const statement = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  const broken: ParsedStatement = { ...statement, validation: { matches: false, checks: [{ label: "Total de cargos", expected: 1, actual: 2, isMoney: true }] } };
  await assert.rejects(run(BBVA_ACCOUNT, broken), StatementTotalsMismatchError);
  assert.equal((await run(BBVA_ACCOUNT, broken, [], { acknowledgeMismatch: true })).imported, 4);
});

test("decisiones inválidas: vincular un movimiento nuevo, índices repetidos o fuera de rango, categoría ajena o en una transferencia", async () => {
  const { world, run } = setup();
  const statement = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  await assert.rejects(run(BBVA_ACCOUNT, statement, [{ index: 0, action: "link" }]), InvalidStatementDecisionError);
  await assert.rejects(run(BBVA_ACCOUNT, statement, [{ index: 0, action: "import" }, { index: 0, action: "skip" }]), InvalidStatementDecisionError);
  await assert.rejects(run(BBVA_ACCOUNT, statement, [{ index: 99, action: "import" }]), InvalidStatementDecisionError);
  await assert.rejects(run(BBVA_ACCOUNT, statement, [{ index: 0, action: "import", categoryId: 777 }]), InvalidStatementDecisionError);
  await assert.rejects(run(BBVA_ACCOUNT, statement, [{ index: 0, action: "import", typeOverride: "internal_transfer", categoryId: 10 }]), InvalidStatementDecisionError);
  assert.equal(world.transactions.size, 0);
});

test("se puede elegir categoría propia y cambiar el tipo; una transferencia no suma a gastos ni ingresos", async () => {
  const { world, run } = setup();
  const statement = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  await run(BBVA_ACCOUNT, statement, [{ index: 0, action: "import", categoryId: 10 }, { index: 1, action: "import", typeOverride: "internal_transfer" }, { index: 2, action: "skip" }, { index: 3, action: "import" }]);
  const byName = [...world.transactions.values()];
  assert.equal(byName.find((t) => t.amountCents === -6_700)?.categoryId, 10);
  assert.equal(byName.find((t) => t.amountCents === -1_200)?.kind, "transfer");
  assert.deepEqual(world.monthTotals("2026-08-01"), { income: 2_039_735, expense: -6_700 });
  assert.equal(world.categoryTotals.get("10|2026-08-01"), -6_700);
});

test("cuenta ajena, archivada o inexistente se rechaza", async () => {
  const { reconcile } = setup();
  const statement = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  for (const accountId of [9, 8, 404]) await assert.rejects(reconcile.execute(FAMILY, accountId, statement), StatementAccountError);
});

test("carrera: si entre la vista previa y la confirmación otro proceso importó los mismos movimientos, no se duplica", async () => {
  const { world, confirm } = setup();
  const statement = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  const original = world.existingHashes.bind(world);
  world.existingHashes = async (accountId, hashes) => {
    await original(accountId, hashes);
    return hashes.slice(0, 1);
  };
  await assert.rejects(confirm.execute({ familyId: FAMILY, accountId: BBVA_ACCOUNT, statement, decisions: [], acknowledgeMismatch: false }), StatementAlreadyImportedError);
  assert.equal(world.transactions.size, 0);
  assert.equal(world.storedImports.length, 0);
});

test("el reporte inverso lista lo manual del periodo que el estado no respalda", async () => {
  const { world, reconcile } = setup();
  world.addManual({ accountId: BBVA_ACCOUNT, date: "2026-08-05", amountCents: -6_700, name: "oxxo" });
  const orphan = world.addManual({ accountId: BBVA_ACCOUNT, date: "2026-08-20", amountCents: -99_900, name: "error de captura" });
  const preview = await reconcile.execute(FAMILY, BBVA_ACCOUNT, bbva(["05/08/2026", "04/09/2026"], AUGUST));
  assert.deepEqual(preview.unmatchedExisting.map((e) => e.id), [orphan.id]);
});

function fakeExtractor(words: PdfWord[]): PdfTextExtractor {
  return { extract: async () => words };
}

test("el parseo devuelve la vista previa sin guardar nada: ni movimientos, ni saldos, ni registro de importación", async () => {
  const { world, reconcile } = setup();
  const parse = new ParseStatementUseCase(fakeExtractor(bbvaDocument({ period: ["05/08/2026", "04/09/2026"], opening: 100_000, movements: AUGUST })), world.contextRepository(), reconcile);
  const { statement, preview } = await parse.execute({ familyId: FAMILY, accountId: BBVA_ACCOUNT, bank: "bbva_debito", data: new Uint8Array(4) });
  assert.equal(statement.transactions.length, 4);
  assert.equal(preview.counts.new, 4);
  assert.equal(world.transactions.size, 0);
  assert.equal(world.storedImports.length, 0);
  assert.equal(world.balanceOf(BBVA_ACCOUNT), 0);
});

test("si el banco elegido no coincide pero otro parser lo reconoce, avisa cuál parece; si ninguno lo reconoce, es un error de formato", async () => {
  const { world, reconcile } = setup();
  const nuWords = nuDebitDocument({ period: "del 01 al 31 ago 2026", opening: 0, movements: [{ day: "05", month: "AGO", description: "OXXO Compra", cents: -5_000 }] });
  const mismatch = new ParseStatementUseCase(fakeExtractor(nuWords), world.contextRepository(), reconcile);
  await assert.rejects(mismatch.execute({ familyId: FAMILY, accountId: BBVA_ACCOUNT, bank: "bbva_debito", data: new Uint8Array(4) }), (error: unknown) => error instanceof BankMismatchError && error.detected === "nu_debito");
  const unknown = new ParseStatementUseCase(fakeExtractor([]), world.contextRepository(), reconcile);
  await assert.rejects(unknown.execute({ familyId: FAMILY, accountId: BBVA_ACCOUNT, bank: "bbva_debito", data: new Uint8Array(4) }), StatementFormatError);
});

test("el procesamiento del estado no escribe nada a disco", async () => {
  const { world, reconcile, run } = setup();
  const writes: string[] = [];
  const names = ["writeFile", "writeFileSync", "appendFile", "appendFileSync", "createWriteStream", "mkdtemp", "mkdtempSync"] as const;
  const originals = Object.fromEntries(names.map((n) => [n, fs[n]]));
  for (const name of names) (fs as unknown as Record<string, unknown>)[name] = (...args: unknown[]) => (writes.push(name), (originals[name] as (...a: unknown[]) => unknown)(...args));
  try {
    const parse = new ParseStatementUseCase(fakeExtractor(bbvaDocument({ period: ["05/08/2026", "04/09/2026"], opening: 100_000, movements: AUGUST })), world.contextRepository(), reconcile);
    const { statement } = await parse.execute({ familyId: FAMILY, accountId: BBVA_ACCOUNT, bank: "bbva_debito", data: new Uint8Array(4) });
    await run(BBVA_ACCOUNT, statement);
  } finally {
    Object.assign(fs, originals);
  }
  assert.deepEqual(writes, []);
});

test("después de importar: las reglas resuelven comercio y la IA solo categoriza con confianza alta, sin tocar transferencias", async () => {
  const { world, run } = setup();
  await run(BBVA_ACCOUNT, bbva(["05/08/2026", "04/09/2026"], AUGUST), [{ index: 0, action: "import" }, { index: 1, action: "import" }, { index: 2, action: "import", typeOverride: "internal_transfer" }, { index: 3, action: "import" }]);
  const resolved: number[] = [];
  const classifier: CategoryClassifier = { classify: async ({ description }) => (/OXXO/.test(description) ? { categoryId: 10, confidence: "high" } : /VA Y VEN/.test(description) ? { categoryId: 11, confidence: "medium" } : null) };
  const categories = { list: async () => [{ id: 10, parentId: null, name: "Compras", color: "", icon: "", classification: "expense" as const, spendingNature: null }, { id: 11, parentId: null, name: "Transporte", color: "", icon: "", classification: "expense" as const, spendingNature: null }, { id: 20, parentId: null, name: "Nómina", color: "", icon: "", classification: "income" as const, spendingNature: null }] };
  const enrich = new EnrichImportedTransactionsUseCase(world, categories as never, new UpdateTransactionUseCase(world as unknown as { run: <T>(fn: (ops: LedgerOperations) => Promise<T>) => Promise<T> }), { execute: async (id) => void resolved.push(id) }, classifier);
  const result = await enrich.execute(FAMILY, [...world.transactions.keys()]);

  assert.deepEqual(resolved.sort(), [...world.transactions.keys()].sort());
  assert.equal(result.categorizedByAi, 1);
  const byAmount = (cents: number) => [...world.transactions.values()].filter((t) => t.amountCents === cents);
  assert.equal(byAmount(-6_700)[0].categoryId, 10);
  assert.equal(byAmount(-1_200).filter((t) => t.kind === "standard")[0].categoryId ?? null, null, "confianza media: no se aplica");
  assert.equal(byAmount(-1_200).filter((t) => t.kind === "transfer")[0].categoryId ?? null, null, "una transferencia no se categoriza");
  assert.equal(world.categoryTotals.get("10|2026-08-01"), -6_700);
});

test("cancelar mientras se importa revierte todo: sin movimientos, saldos ni registro de importación", async () => {
  const { world, run } = setup();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => run(BBVA_ACCOUNT, bbva(["05/08/2026", "04/09/2026"], AUGUST), [], { signal: controller.signal }), StatementImportCancelledError);
  assert.equal(world.transactions.size, 0);
  assert.equal(world.balanceOf(BBVA_ACCOUNT), 0);
  assert.equal(world.storedImports.length, 0);
});

test("deshacer una importación elimina lo creado, restaura el saldo y deja el estado listo para importarse otra vez", async () => {
  const { world, run } = setup();
  const statement = bbva(["05/08/2026", "04/09/2026"], AUGUST);
  const manual = world.addManual({ accountId: BBVA_ACCOUNT, date: "2026-08-06", amountCents: -1_200, name: "Va y ven manual" });
  const balanceBefore = world.balanceOf(BBVA_ACCOUNT);
  const result = await run(BBVA_ACCOUNT, statement, [{ index: 1, action: "link", linkTransactionId: manual.id }]);
  assert.ok(result.imported > 0);

  const undo = new UndoStatementImportUseCase(world);
  const undone = await undo.execute(FAMILY, result.importId);
  assert.equal(undone.removed, result.imported);
  assert.deepEqual([...world.transactions.keys()], [manual.id]);
  assert.equal(world.balanceOf(BBVA_ACCOUNT), balanceBefore);
  assert.equal(world.storedImports.length, 0);
  const restored = world.transactions.get(manual.id);
  assert.equal(restored?.importHash, null);
  assert.equal(restored?.importId, null);
  assert.equal(restored?.name, "Va y ven manual");

  const again = await run(BBVA_ACCOUNT, statement);
  assert.ok(again.imported > 0);
});

test("no se puede deshacer una importación ajena ni inexistente", async () => {
  const { world, run } = setup();
  const result = await run(BBVA_ACCOUNT, bbva(["05/08/2026", "04/09/2026"], AUGUST));
  const undo = new UndoStatementImportUseCase(world);
  await assert.rejects(() => undo.execute(2, result.importId));
  await assert.rejects(() => undo.execute(FAMILY, 999));
  assert.equal(world.transactions.size, 4);
});
