import assert from "node:assert/strict";
import { test } from "node:test";
import { bestConceptMatch, evaluateConceptMatch } from "./rules";

const INTERNET_CASA = {
  conceptId: 1,
  categoryId: 54,
  providerId: 10, // Telmex
  habitualAccountId: 52, // Nu Débito
  expectedAmountCents: -49900,
  expectedDayOfMonth: 2,
};

const LUZ = {
  conceptId: 2,
  categoryId: 54, // misma categoría "Servicios" que Internet Casa
  providerId: 11, // CFE
  habitualAccountId: null,
  expectedAmountCents: -60000,
  expectedDayOfMonth: 20,
};

const AGUA = {
  conceptId: 3,
  categoryId: 54,
  providerId: 12, // JAPAY
  habitualAccountId: null,
  expectedAmountCents: -20000,
  expectedDayOfMonth: 28,
};

test("evaluateConceptMatch: proveedor+monto+día coinciden -> fuerte", () => {
  const result = evaluateConceptMatch(
    { accountId: 52, date: "2026-10-01", amountCents: -49900, categoryId: 54, providerId: 10 },
    INTERNET_CASA,
  );
  assert.equal(result.confidence, "strong");
});

test("escenario #38 del documento: cambiar de cuenta no debe impedir el match (cuenta es señal, no llave)", () => {
  // mismo pago de Telmex, pero esta vez desde BBVA en vez de la cuenta habitual Nu Débito
  const result = evaluateConceptMatch(
    { accountId: 47, date: "2026-10-01", amountCents: -49900, categoryId: 54, providerId: 10 },
    INTERNET_CASA,
  );
  assert.equal(result.confidence, "strong");
});

test("escenario #38 del documento: Luz/Agua/Internet comparten cuenta y categoría pero el proveedor las distingue — nunca se confunden", () => {
  const tx = { accountId: 47, date: "2026-10-20", amountCents: -60000, categoryId: 54, providerId: 11 }; // pago real de CFE
  const best = bestConceptMatch(tx, [INTERNET_CASA, LUZ, AGUA]);
  assert.equal(best?.conceptId, LUZ.conceptId);
});

test("regla de oro (#34): sin proveedor y con 2+ candidatos de la misma categoría, nunca llega a 'strong'", () => {
  // $500 en "Servicios", sin proveedor identificado — exactamente el ejemplo del documento (#9)
  const tx = { accountId: 47, date: "2026-10-15", amountCents: -50000, categoryId: 54, providerId: null };
  for (const candidate of [INTERNET_CASA, LUZ, AGUA]) {
    const result = evaluateConceptMatch(tx, candidate);
    assert.notEqual(result.confidence, "strong");
  }
});

test("sin ninguna señal coincidente, la confianza es 'none' (no se sugiere nada)", () => {
  // día 10: fuera de tolerancia (±5) de los días esperados de las 3 (2, 20, 28)
  const tx = { accountId: 47, date: "2026-01-10", amountCents: -100, categoryId: 99, providerId: 999 };
  const result = evaluateConceptMatch(tx, INTERNET_CASA);
  assert.equal(result.confidence, "none");
});

test("bestConceptMatch: devuelve null cuando ningún candidato tiene ninguna señal", () => {
  const tx = { accountId: 1, date: "2026-01-10", amountCents: -1, categoryId: null, providerId: null };
  assert.equal(bestConceptMatch(tx, [INTERNET_CASA, LUZ, AGUA]), null);
});

test("bestConceptMatch: con empate de categoría pero monto/día distintos, gana el de mayor puntaje", () => {
  // monto y día coinciden exactos con AGUA, categoría compartida con las 3
  const tx = { accountId: 1, date: "2026-10-28", amountCents: -20000, categoryId: 54, providerId: null };
  const best = bestConceptMatch(tx, [INTERNET_CASA, LUZ, AGUA]);
  assert.equal(best?.conceptId, AGUA.conceptId);
  assert.equal(best?.confidence, "medium");
});
