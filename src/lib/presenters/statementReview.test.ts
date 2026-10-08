import assert from "node:assert/strict";
import { test } from "node:test";
import { reviewTabs, rowsForTab } from "./statementReview";

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
