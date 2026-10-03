import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeMerchantPattern, sanitizeCleanName } from "./rules";

test("normalizeMerchantPattern: mayúsculas, sin números, espacios colapsados", () => {
  assert.equal(normalizeMerchantPattern("SP *UBER *TRIP 883219 MEXICO CITY MX"), "SP UBER TRIP MEXICO CITY MX");
});

test("normalizeMerchantPattern: dos folios numéricos distintos dan el mismo patrón", () => {
  const a = normalizeMerchantPattern("SP *UBER *TRIP 883219 MEXICO CITY MX");
  const b = normalizeMerchantPattern("SP *UBER *TRIP 991044 MEXICO CITY MX");
  assert.equal(a, b);
});

test("sanitizeCleanName: quita comillas envolventes y espacios", () => {
  assert.equal(sanitizeCleanName('"Uber"'), "Uber");
  assert.equal(sanitizeCleanName("  Netflix  "), "Netflix");
});

test("sanitizeCleanName: si el modelo devuelve varias líneas, se queda solo con la primera", () => {
  assert.equal(sanitizeCleanName("Uber\nEs un servicio de transporte"), "Uber");
});

test("sanitizeCleanName: trunca a 60 caracteres", () => {
  const long = "A".repeat(100);
  assert.equal(sanitizeCleanName(long).length, 60);
});

test("sanitizeCleanName: respuesta vacía lanza error en vez de guardar un nombre en blanco", () => {
  assert.throws(() => sanitizeCleanName("   "));
  assert.throws(() => sanitizeCleanName('""'));
});
