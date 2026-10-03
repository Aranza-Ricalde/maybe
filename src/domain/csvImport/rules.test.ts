import assert from "node:assert/strict";
import { test } from "node:test";
import { CsvRowError, bankSignature, mapRowToTransaction, parseCsv } from "./rules";

test("parseCsv: caso simple sin comillas", () => {
  const { headers, rows } = parseCsv("Date,Amount\n2026-01-01,100\n2026-01-02,-50\n");
  assert.deepEqual(headers, ["Date", "Amount"]);
  assert.deepEqual(rows, [
    { Date: "2026-01-01", Amount: "100" },
    { Date: "2026-01-02", Amount: "-50" },
  ]);
});

test("parseCsv: comillas con coma adentro no se parten en dos columnas", () => {
  const { rows } = parseCsv('Date,Description,Amount\n2026-01-05,"Super, tienda principal",-500.00\n');
  assert.equal(rows[0].Description, "Super, tienda principal");
  assert.equal(rows[0].Amount, "-500.00");
});

test("parseCsv: comillas escapadas (\"\") dentro de un campo", () => {
  const { rows } = parseCsv('Name\n"Dijo ""hola"" el cliente"\n');
  assert.equal(rows[0].Name, 'Dijo "hola" el cliente');
});

test("parseCsv: saltos de línea CRLF se tratan igual que LF", () => {
  const { rows } = parseCsv("A,B\r\n1,2\r\n3,4\r\n");
  assert.deepEqual(rows, [
    { A: "1", B: "2" },
    { A: "3", B: "4" },
  ]);
});

test("parseCsv: texto vacío da headers y rows vacíos", () => {
  assert.deepEqual(parseCsv(""), { headers: [], rows: [] });
});

test("bankSignature normaliza mayúsculas/espacios para identificar el mismo formato de banco", () => {
  assert.equal(bankSignature(["Date", "Amount", "Description"]), bankSignature(["date", "amount", "description"]));
  assert.equal(bankSignature([" Date ", "Amount"]), bankSignature(["date", "amount"]));
});

const mapping = { date: "Date", amount: "Amount", name: "Description" };

test("mapRowToTransaction: fecha ISO pasa directo", () => {
  const result = mapRowToTransaction({ Date: "2026-03-15", Amount: "-150.00", Description: "Tacos" }, mapping);
  assert.equal(result.date, "2026-03-15");
});

test("mapRowToTransaction: fecha MM/DD/YYYY se convierte a ISO", () => {
  const result = mapRowToTransaction({ Date: "3/5/2026", Amount: "-150.00", Description: "Tacos" }, mapping);
  assert.equal(result.date, "2026-03-05");
});

test("mapRowToTransaction: formato de fecha no reconocido lanza CsvRowError", () => {
  assert.throws(
    () => mapRowToTransaction({ Date: "15 de marzo", Amount: "-150.00", Description: "Tacos" }, mapping),
    CsvRowError,
  );
});

test("mapRowToTransaction: montos con símbolo de moneda y comas de miles", () => {
  const result = mapRowToTransaction({ Date: "2026-03-15", Amount: "$1,234.56", Description: "Compra" }, mapping);
  assert.equal(result.amountCents, 123456);
});

test("mapRowToTransaction: negativo con paréntesis (convención contable)", () => {
  const result = mapRowToTransaction({ Date: "2026-03-15", Amount: "(50.00)", Description: "Gasto" }, mapping);
  assert.equal(result.amountCents, -5000);
});

test("mapRowToTransaction: monto no numérico lanza CsvRowError", () => {
  assert.throws(
    () => mapRowToTransaction({ Date: "2026-03-15", Amount: "no-es-un-numero", Description: "x" }, mapping),
    CsvRowError,
  );
});

test("mapRowToTransaction: columna mapeada que no existe en la fila lanza CsvRowError", () => {
  assert.throws(() => mapRowToTransaction({ Date: "2026-03-15", Amount: "10" }, mapping), CsvRowError);
});

test("mapRowToTransaction: notes es opcional", () => {
  const withNotes = mapRowToTransaction(
    { Date: "2026-03-15", Amount: "10", Description: "x", Notes: "una nota" },
    { ...mapping, notes: "Notes" },
  );
  assert.equal(withNotes.notes, "una nota");

  const withoutNotes = mapRowToTransaction({ Date: "2026-03-15", Amount: "10", Description: "x" }, mapping);
  assert.equal(withoutNotes.notes, undefined);
});
