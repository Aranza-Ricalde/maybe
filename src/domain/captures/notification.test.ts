import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBankNotification } from "./notification";

const TODAY = "2026-10-06";

test("la notificación de compra de BBVA se entiende completa: gasto, monto, comercio y fecha", () => {
  const text = "Compra con TDD\nCompra con CUENTA en ANTHROPIC* CLAUDE $349.00 06 octubre 12:44h";
  assert.deepEqual(parseBankNotification(text, TODAY), { type: "expense", amountCents: 34_900, description: "ANTHROPIC* CLAUDE", date: "2026-10-06" });
});

test("un depósito es ingreso y los montos con miles se leen bien", () => {
  const parsed = parseBankNotification("Depósito recibido en CUENTA de NOMINA ACME $12,345.50 05 octubre", TODAY);
  assert.equal(parsed?.type, "income");
  assert.equal(parsed?.amountCents, 1_234_550);
  assert.equal(parsed?.date, "2026-10-05");
});

test("una fecha sin año que caería en el futuro se toma del año anterior", () => {
  assert.equal(parseBankNotification("Compra con CUENTA en OXXO $10.00 28 diciembre", TODAY)?.date, "2025-12-28");
});

test("sin fecha en el texto no inventa una", () => {
  assert.equal(parseBankNotification("Compra con CUENTA en OXXO $10.00", TODAY)?.date, undefined);
});

test("si no hay monto, comercio, o no se sabe si es gasto o ingreso, no adivina", () => {
  for (const text of ["Hola, ¿cómo estás?", "Compra con CUENTA en OXXO", "Movimiento en OXXO $10.00", "Compra y depósito en OXXO $10.00", "Compra con CUENTA $10.00"]) {
    assert.equal(parseBankNotification(text, TODAY), null, text);
  }
});
