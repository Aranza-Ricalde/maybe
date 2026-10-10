import assert from "node:assert/strict";
import { test } from "node:test";
import { REVIEW_TAB_HELP, REVIEW_TAB_ORDER, REVIEW_TAB_TITLES, importSummaryLabel, reviewTabs, rowsForTab } from "./statementReview";

const preview = {
  counts: { new: 2, probableMatch: 1, alreadyImported: 1 },
  unmatchedExisting: [{}, {}, {}],
  rows: [{ status: "new" }, { status: "probable_match" }, { status: "new" }, { status: "already_imported" }],
} as never;

test("cada pestaña muestra su conteo", () => {
  assert.deepEqual(reviewTabs(preview).map((tab) => tab.label), ["Nuevos (2)", "Ya los tengo (1)", "Ya importados (1)", "Solo en mi app (3)"]);
});

test("cada pestaña filtra las filas por su estado", () => {
  assert.equal(rowsForTab(preview, "new").length, 2);
  assert.equal(rowsForTab(preview, "probable").length, 1);
  assert.equal(rowsForTab(preview, "imported").length, 1);
});

test("el resumen de importación omite los ceros y dice cuando no hay nada seleccionado", () => {
  assert.deepEqual(importSummaryLabel({ toImport: 0, toLink: 0, toSkip: 0 }), { headline: "Nada seleccionado", detail: "Elige qué importar" });
  assert.deepEqual(importSummaryLabel({ toImport: 0, toLink: 0, toSkip: 4 }), { headline: "Nada seleccionado", detail: "4 omitidos" });
  assert.deepEqual(importSummaryLabel({ toImport: 1, toLink: 0, toSkip: 0 }), { headline: "1 movimiento", detail: "1 por crear" });
  assert.deepEqual(importSummaryLabel({ toImport: 12, toLink: 3, toSkip: 2 }), { headline: "15 movimientos", detail: "12 por crear · 3 por vincular · 2 omitidos" });
});

test("cada pestaña tiene título y explicación en la ayuda", () => {
  assert.equal(REVIEW_TAB_ORDER.length, 4);
  for (const key of REVIEW_TAB_ORDER) {
    assert.ok(REVIEW_TAB_TITLES[key].length > 0);
    assert.ok(REVIEW_TAB_HELP[key].length > 0);
  }
});
