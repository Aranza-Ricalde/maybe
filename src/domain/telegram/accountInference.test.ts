import assert from "node:assert/strict";
import { test } from "node:test";
import { inferAccountFromText } from "./accountInference";

const ACCOUNTS = [{ id: 1, name: "BBVA" }, { id: 2, name: "Cuenta Nómina" }, { id: 3, name: "Nu tdc" }, { id: 4, name: "Nu Débito" }, { id: 5, name: "Openbank" }];

test("una palabra distintiva del nombre identifica la cuenta con certeza", () => {
  assert.equal(inferAccountFromText("150 gasolina openbank", ACCOUNTS)?.id, 5);
  assert.equal(inferAccountFromText("Compra BBVA $50", ACCOUNTS)?.id, 1);
  assert.equal(inferAccountFromText("nómina", ACCOUNTS)?.id, 2);
});

test("palabras genéricas como 'cuenta' o 'tarjeta' no bastan para identificar una cuenta", () => {
  assert.equal(inferAccountFromText("Compra con CUENTA en ANTHROPIC $349", ACCOUNTS), null);
  assert.equal(inferAccountFromText("pago con tarjeta de débito", ACCOUNTS), null);
});

test("si el texto coincide con varias cuentas no se adivina", () => {
  assert.equal(inferAccountFromText("200 gasolina nu", ACCOUNTS), null);
});

test("sin ninguna pista, no hay cuenta", () => {
  assert.equal(inferAccountFromText("150 tacos", ACCOUNTS), null);
  assert.equal(inferAccountFromText("150 tacos", []), null);
});
