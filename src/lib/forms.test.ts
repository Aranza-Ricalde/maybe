import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { idField, isoDateField, nonZeroPesosField, optionalIdField, optionalText, pageSizeField, parseForm, requiredText } from "./forms";

function form(entries: Array<[string, string]>): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

test("parseForm: devuelve los datos limpios cuando todo es válido", () => {
  const schema = z.object({ id: idField, name: requiredText(10), note: optionalText(20), categoryId: optionalIdField });
  assert.deepEqual(parseForm(form([["id", "7"], ["name", "  tacos "], ["note", ""], ["categoryId", ""]]), schema), { id: 7, name: "tacos", note: null, categoryId: null });
});

test("parseForm: null si falta un campo, es demasiado largo o no es entero positivo", () => {
  const schema = z.object({ id: idField, name: requiredText(5) });
  assert.equal(parseForm(form([["id", "0"], ["name", "ok"]]), schema), null);
  assert.equal(parseForm(form([["id", "1.5"], ["name", "ok"]]), schema), null);
  assert.equal(parseForm(form([["id", "1"], ["name", "demasiado largo"]]), schema), null);
  assert.equal(parseForm(form([["id", "1"]]), schema), null);
});

test("parseForm: los campos repetidos llegan como arreglo", () => {
  const schema = z.object({ accountIds: z.preprocess((v) => (Array.isArray(v) ? v : v == null ? [] : [v]), z.array(idField)) });
  assert.deepEqual(parseForm(form([["accountIds", "1"], ["accountIds", "2"]]), schema), { accountIds: [1, 2] });
  assert.deepEqual(parseForm(form([["accountIds", "3"]]), schema), { accountIds: [3] });
  assert.deepEqual(parseForm(form([]), schema), { accountIds: [] });
});

test("montos, fechas y tamaños de página tienen límites", () => {
  assert.equal(nonZeroPesosField.safeParse("0").success, false);
  assert.equal(nonZeroPesosField.safeParse("Infinity").success, false);
  assert.equal(nonZeroPesosField.safeParse("5000000000").success, false);
  assert.equal(nonZeroPesosField.safeParse("-123.45").success, true);
  assert.equal(isoDateField.safeParse("2026-02-30").success, false);
  assert.equal(isoDateField.safeParse("2026-02-28").success, true);
  assert.equal(pageSizeField.safeParse("101").success, false);
  assert.equal(pageSizeField.safeParse("100").success, true);
});
