import assert from "node:assert/strict";
import { test } from "node:test";
import { capturePayload } from "./schemas";

const valid = { account: " BBVA ", type: "expense", amount: 150.5, description: " Tacos " };

test("un cuerpo válido se normaliza a centavos y texto recortado", () => {
  const result = capturePayload.parse(valid);
  assert.deepEqual(result, { accountName: "BBVA", movement: { type: "expense", amountCents: 15_050, description: "Tacos", date: undefined, notes: undefined } });
});

test("el monto acepta texto con punto o coma decimal, como mandan los atajos", () => {
  assert.equal(capturePayload.parse({ ...valid, amount: "150,50" }).movement.amountCents, 15_050);
  assert.equal(capturePayload.parse({ ...valid, amount: "99" }).movement.amountCents, 9_900);
});

test("se rechazan montos cero, negativos, con demasiados decimales o absurdos", () => {
  for (const amount of [0, -5, "-5", "1.234", "abc", 1e12, Number.NaN]) assert.equal(capturePayload.safeParse({ ...valid, amount }).success, false, String(amount));
});

test("cuenta, tipo y descripción son obligatorios y el tipo solo puede ser expense o income", () => {
  for (const patch of [{ account: "" }, { type: "transfer" }, { description: "  " }, { date: "2026-02-31" }, { date: "ayer" }, { date: "2026-13-45" }]) assert.equal(capturePayload.safeParse({ ...valid, ...patch }).success, false, JSON.stringify(patch));
  assert.equal(capturePayload.safeParse({ ...valid, date: "2026-10-05", notes: "nota" }).success, true);
});

import { captureMessagePayload } from "./schemas";

test("la forma de mensaje solo acepta message, con texto, y rechaza campos extra", () => {
  assert.equal(captureMessagePayload.safeParse({ message: "Compra con CUENTA en REST $20.00" }).success, true);
  assert.equal(captureMessagePayload.safeParse({ message: "  " }).success, false);
  assert.equal(captureMessagePayload.safeParse({}).success, false);
  assert.equal(captureMessagePayload.safeParse({ message: "x", amount: 5 }).success, false);
  assert.equal(captureMessagePayload.safeParse({ message: "x".repeat(2001) }).success, false);
});
