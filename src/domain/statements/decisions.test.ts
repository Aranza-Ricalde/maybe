import assert from "node:assert/strict";
import { test } from "node:test";
import { importAllNew, initialChoices, linkAllHighConfidence, setAction, setCategory, setPair, setType, skipAllProbable, summarizeChoices, toDecisions } from "./decisions";
import type { PreviewRow, StatementPreview } from "./reconcile";

const row = (index: number, extra: Partial<PreviewRow> = {}): PreviewRow => ({
  index,
  hash: `h${index}`,
  transaction: { date: "2026-08-05", description: `m${index}`, amountCents: -1_000, type: "expense" },
  status: "new",
  match: null,
  selected: true,
  defaultAction: "import",
  locked: false,
  sameAmountElsewhere: [],
  pairSuggestion: null,
  ...extra,
});
const match = (confidence: "high" | "medium" | "low") => ({ transactionId: 77, name: "x", date: "2026-08-05", amountCents: -1_000, categoryId: null, source: "manual", confidence, dateDistance: 0, similarity: 1 });
const probable = (index: number, confidence: "high" | "medium" | "low") => row(index, { status: "probable_match", match: match(confidence), selected: false, defaultAction: "skip" });
const previewOf = (rows: PreviewRow[]): StatementPreview => ({ bank: "bbva_debito", accountLast4: "1", periodStart: "2026-08-01", periodEnd: "2026-08-31", openingBalanceCents: null, closingBalanceCents: null, validation: { checks: [], matches: true }, metadata: {}, warnings: [], rows, unmatchedExisting: [], counts: { new: 0, probableMatch: 0, alreadyImported: 0 } });

test("las decisiones iniciales siguen los valores por defecto y las filas bloqueadas no se envían", () => {
  const preview = previewOf([row(0), probable(1, "high"), row(2, { status: "already_imported", locked: true, selected: false, defaultAction: "skip" })]);
  assert.deepEqual(initialChoices(preview).map((c) => c.action), ["import", "skip", "skip"]);
  assert.deepEqual(toDecisions(preview, initialChoices(preview)), [{ index: 0, action: "import" }, { index: 1, action: "skip" }]);
});

test("vincular todos los de confianza alta no toca los de confianza media o baja ni los nuevos", () => {
  const preview = previewOf([probable(0, "high"), probable(1, "medium"), probable(2, "low"), row(3)]);
  assert.deepEqual(linkAllHighConfidence(preview, initialChoices(preview)).map((c) => c.action), ["link", "skip", "skip", "import"]);
});

test("omitir todos los probables los deja en omitir aunque estuvieran vinculados", () => {
  const preview = previewOf([probable(0, "high"), probable(1, "low"), row(2)]);
  const linked = linkAllHighConfidence(preview, initialChoices(preview));
  assert.deepEqual(skipAllProbable(preview, linked).map((c) => c.action), ["skip", "skip", "import"]);
});

test("vincular envía el movimiento a vincular y puede cambiarse a importar como nuevo", () => {
  const preview = previewOf([probable(0, "low")]);
  const choices = setAction(initialChoices(preview), 0, "link");
  assert.deepEqual(toDecisions(preview, choices), [{ index: 0, action: "link", linkTransactionId: 77 }]);
  assert.deepEqual(toDecisions(preview, setAction(choices, 0, "import")), [{ index: 0, action: "import" }]);
});

test("categoría y tipo solo se envían cuando cambian, y una transferencia nunca lleva categoría", () => {
  const preview = previewOf([row(0)]);
  const withCategory = setCategory(initialChoices(preview), 0, 10);
  assert.deepEqual(toDecisions(preview, withCategory), [{ index: 0, action: "import", categoryId: 10 }]);
  assert.deepEqual(toDecisions(preview, setType(withCategory, 0, "internal_transfer")), [{ index: 0, action: "import", typeOverride: "internal_transfer" }]);
});

test("emparejar fuerza el tipo de la sugerencia, quita la categoría y marca la fila como importar", () => {
  const preview = previewOf([row(0, { selected: false, defaultAction: "skip", pairSuggestion: { transactionId: 500, accountName: "Nu TDC", date: "2026-08-05", kind: "cc_payment" } })]);
  const choices = setPair(preview, initialChoices(preview), 0, true);
  assert.deepEqual(toDecisions(preview, choices), [{ index: 0, action: "import", typeOverride: "card_payment", pairWithTransactionId: 500 }]);
  assert.deepEqual(toDecisions(preview, setPair(preview, choices, 0, false)), [{ index: 0, action: "import", typeOverride: "card_payment" }]);
  assert.equal(setPair(previewOf([row(0)]), [initialChoices(previewOf([row(0)]))[0]], 0, true)[0].pair, false);
});

test("omitir una fila emparejada quita el emparejamiento", () => {
  const preview = previewOf([row(0, { pairSuggestion: { transactionId: 500, accountName: "x", date: "2026-08-05", kind: "transfer" } })]);
  const skipped = setAction(setPair(preview, initialChoices(preview), 0, true), 0, "skip");
  assert.deepEqual(toDecisions(preview, skipped), [{ index: 0, action: "skip" }]);
});

test("marcar o desmarcar todos los nuevos respeta el rendimiento derivado", () => {
  const derived = row(1, { selected: false, defaultAction: "skip", transaction: { date: "2026-08-31", description: "Dinero generado", amountCents: 100, type: "income", derived: true } });
  const preview = previewOf([row(0), derived]);
  assert.deepEqual(importAllNew(preview, initialChoices(preview), false).map((c) => c.action), ["skip", "skip"]);
  assert.deepEqual(importAllNew(preview, initialChoices(preview), true).map((c) => c.action), ["import", "skip"]);
});

test("el resumen cuenta importar, vincular, omitir y emparejar sin contar las filas bloqueadas", () => {
  const preview = previewOf([row(0), probable(1, "high"), probable(2, "low"), row(3, { status: "already_imported", locked: true, selected: false, defaultAction: "skip" })]);
  const choices = linkAllHighConfidence(preview, initialChoices(preview));
  assert.deepEqual(summarizeChoices(preview, choices), { toImport: 1, toLink: 1, toSkip: 1, toPair: 0 });
});

test("no se puede confirmar sin nada que importar o vincular, ni con totales que no cuadran sin aceptarlo, ni mientras se importa", async () => {
  const { canConfirmImport } = await import("./decisions");
  const preview = { rows: [{ locked: false }], validation: { checks: [{ expected: 1, actual: 1 }] } } as never;
  const mismatched = { rows: [{ locked: false }], validation: { checks: [{ expected: 1, actual: 2 }] } } as never;
  const importing = [{ action: "import", pair: false }] as never;
  const skipping = [{ action: "skip", pair: false }] as never;
  assert.equal(canConfirmImport(preview, importing, false, false), true);
  assert.equal(canConfirmImport(preview, skipping, false, false), false);
  assert.equal(canConfirmImport(preview, importing, false, true), false);
  assert.equal(canConfirmImport(mismatched, importing, false, false), false);
  assert.equal(canConfirmImport(mismatched, importing, true, false), true);
});
