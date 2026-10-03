import assert from "node:assert/strict";
import { test } from "node:test";
import { TelegramParseError, parseTelegramMessage } from "./rules";

test("parseTelegramMessage: sin signo es gasto", () => {
  const result = parseTelegramMessage("150 tacos");
  assert.equal(result.amountCents, -15000);
  assert.equal(result.description, "tacos");
  assert.equal(result.accountHint, undefined);
});

test("parseTelegramMessage: con signo - explícito también es gasto", () => {
  const result = parseTelegramMessage("-150 tacos");
  assert.equal(result.amountCents, -15000);
});

test("parseTelegramMessage: el + es obligatorio para marcar ingreso", () => {
  const result = parseTelegramMessage("+200 nomina");
  assert.equal(result.amountCents, 20000);
  assert.equal(result.description, "nomina");
});

test("parseTelegramMessage: #cuenta al final se extrae como hint y se quita de la descripción", () => {
  const result = parseTelegramMessage("50 dulces #efectivo");
  assert.equal(result.description, "dulces");
  assert.equal(result.accountHint, "efectivo");
});

test("parseTelegramMessage: decimales con punto o coma", () => {
  assert.equal(parseTelegramMessage("150.50 tacos").amountCents, -15050);
  assert.equal(parseTelegramMessage("150,50 tacos").amountCents, -15050);
});

test("parseTelegramMessage: mensaje sin monto al inicio no se reconoce", () => {
  assert.throws(() => parseTelegramMessage("hola buenas"), TelegramParseError);
  assert.throws(() => parseTelegramMessage("/start"), TelegramParseError);
});

test("parseTelegramMessage: monto 0 se rechaza explícitamente", () => {
  assert.throws(() => parseTelegramMessage("0 tacos"), TelegramParseError);
  assert.throws(() => parseTelegramMessage("-0 tacos"), TelegramParseError);
});

test("parseTelegramMessage: un '#' sin texto antes no se interpreta como hint (queda como parte de la descripción)", () => {
  const result = parseTelegramMessage("150 #efectivo");
  assert.equal(result.description, "#efectivo");
  assert.equal(result.accountHint, undefined);
});
