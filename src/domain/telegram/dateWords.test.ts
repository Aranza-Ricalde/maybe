import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidSpokenDateError, extractTrailingDate } from "./dateWords";

const TODAY = "2026-10-06";

test("palabras relativas: hoy, ayer, anteayer y antier", () => {
  assert.deepEqual(extractTrailingDate("tacos ayer", TODAY), { text: "tacos", date: "2026-10-05" });
  assert.deepEqual(extractTrailingDate("tacos anteayer", TODAY), { text: "tacos", date: "2026-10-04" });
  assert.deepEqual(extractTrailingDate("tacos antier", TODAY).date, "2026-10-04");
  assert.deepEqual(extractTrailingDate("tacos HOY", TODAY).date, "2026-10-06");
});

test("formatos numéricos y con mes en palabras", () => {
  assert.equal(extractTrailingDate("renta 05/10", TODAY).date, "2026-10-05");
  assert.equal(extractTrailingDate("renta 5/10/26", TODAY).date, "2026-10-05");
  assert.equal(extractTrailingDate("renta 05/10/2025", TODAY).date, "2025-10-05");
  assert.equal(extractTrailingDate("renta 2026-10-01", TODAY).date, "2026-10-01");
  assert.deepEqual(extractTrailingDate("gasolina 3 de octubre", TODAY), { text: "gasolina", date: "2026-10-03" });
  assert.equal(extractTrailingDate("gasolina 3 octubre 2025", TODAY).date, "2025-10-03");
});

test("una fecha sin año que caería en el futuro se toma del año anterior", () => {
  assert.equal(extractTrailingDate("regalo 25/12", TODAY).date, "2025-12-25");
});

test("sin fecha, o sin descripción restante, el texto queda intacto", () => {
  assert.deepEqual(extractTrailingDate("tacos al pastor", TODAY), { text: "tacos al pastor" });
  assert.deepEqual(extractTrailingDate("ayer", TODAY), { text: "ayer" });
  assert.deepEqual(extractTrailingDate("pago del 5", TODAY), { text: "pago del 5" });
});

test("una fecha inexistente o futura lanza un error entendible", () => {
  assert.throws(() => extractTrailingDate("tacos 31/02", TODAY), InvalidSpokenDateError);
  assert.throws(() => extractTrailingDate("tacos 2099-01-01", TODAY), /futura/);
  assert.throws(() => extractTrailingDate("tacos 31 de abril", TODAY), /no existe/);
});
