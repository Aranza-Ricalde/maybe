import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanDescription, groupIntoLines, inferDateInPeriod, isMoneyToken, isoDate, monthNumber, normalizeText, parseMoneyCents } from "./text";
import { StatementFormatError, type PdfWord } from "./types";

const word = (page: number, x0: number, top: number, text: string): PdfWord => ({ page, x0, x1: x0 + text.length * 5, top, bottom: top + 9, text });

test("los montos se convierten a centavos enteros sin pasar por flotantes", () => {
  assert.equal(parseMoneyCents("$1,234.56"), 123_456);
  assert.equal(parseMoneyCents("+$0.01"), 1);
  assert.equal(parseMoneyCents("-$5,996.47"), -599_647);
  assert.equal(parseMoneyCents("20,397.35"), 2_039_735);
  assert.equal(parseMoneyCents("0.10"), 10);
  assert.equal(parseMoneyCents("1,000,000.00"), 100_000_000);
});

test("un monto mal formado es un error de formato", () => {
  for (const bad of ["abc", "12.5", "1,23.45", "$", ""]) assert.throws(() => parseMoneyCents(bad), StatementFormatError, bad);
  assert.equal(isMoneyToken("$1,234.56"), true);
  assert.equal(isMoneyToken("722"), false);
});

test("los meses abreviados en español se reconocen sin importar mayúsculas, acentos o punto", () => {
  assert.deepEqual(["ENE", "feb", "Mar.", "ago", "SEP", "sept", "dic"].map(monthNumber), [1, 2, 3, 8, 9, 9, 12]);
  assert.equal(monthNumber("XYZ"), null);
});

test("una fecha inexistente es un error de formato", () => {
  assert.equal(isoDate(2026, 2, 28), "2026-02-28");
  assert.throws(() => isoDate(2026, 2, 30), StatementFormatError);
});

test("agrupa palabras en líneas por posición vertical (con tolerancia) y las ordena de izquierda a derecha", () => {
  const lines = groupIntoLines([word(1, 200, 102, "mundo"), word(1, 100, 100, "hola"), word(1, 100, 130, "otra"), word(2, 50, 100, "página")]);
  assert.deepEqual(lines.map((l) => l.text), ["hola mundo", "otra", "página"]);
  assert.deepEqual(lines.map((l) => l.page), [1, 1, 2]);
});

test("el año de una fecha sin año se infiere del periodo, incluso cruzando de diciembre a enero", () => {
  assert.equal(inferDateInPeriod(28, 12, "2026-12-05", "2027-01-04"), "2026-12-28");
  assert.equal(inferDateInPeriod(2, 1, "2026-12-05", "2027-01-04"), "2027-01-02");
  assert.equal(inferDateInPeriod(6, 7, "2026-07-05", "2026-08-04"), "2026-07-06");
});

test("normalizar quita acentos y espacios repetidos; cleanDescription recorta y limita el largo", () => {
  assert.equal(normalizeText("  Libretón   BÁSICO "), "libreton basico");
  assert.equal(cleanDescription("  a   b  "), "a b");
  assert.equal(cleanDescription("x".repeat(500)).length, 200);
});
