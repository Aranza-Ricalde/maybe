import assert from "node:assert/strict";
import { test } from "node:test";
import { inboxStatementView } from "./statementInbox";

test("un estado pendiente se muestra con banco, archivo, cuenta y antigüedad", () => {
  const view = inboxStatementView(
    { id: 4, bank: "bbva_debito", accountId: 2, accountName: "BBVA", filename: "1568871032_202610.pdf", sizeBytes: 1000, fromAddress: null, subject: null, receivedAt: "2026-10-10T12:00:00Z" },
    new Date("2026-10-10T15:00:00Z"),
  );
  assert.deepEqual(view, { id: 4, title: "BBVA Libretón Básico Cuenta Digital", filename: "1568871032_202610.pdf", meta: "BBVA · hace 3 h" });
});
