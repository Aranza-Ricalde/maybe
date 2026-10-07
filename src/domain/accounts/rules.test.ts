import assert from "node:assert/strict";
import { test } from "node:test";
import { ACCOUNT_TYPE_LABELS } from "@/lib/format";
import {
  ACCOUNT_TYPES,
  assertValidAccountName,
  assertValidAccountType,
  decideAccountRemoval,
  InvalidAccountError,
  isLiabilityAccountType,
  mergeAccountDetails,
  pickDefaultAccountId,
} from "./rules";

test("isLiabilityAccountType: credit_card, loan y other_liability son pasivo", () => {
  assert.equal(isLiabilityAccountType("credit_card"), true);
  assert.equal(isLiabilityAccountType("loan"), true);
  assert.equal(isLiabilityAccountType("other_liability"), true);
});

test("isLiabilityAccountType: checking, savings, cash, property, vehicle, other_asset son activo", () => {
  assert.equal(isLiabilityAccountType("checking"), false);
  assert.equal(isLiabilityAccountType("savings"), false);
  assert.equal(isLiabilityAccountType("cash"), false);
  assert.equal(isLiabilityAccountType("property"), false);
  assert.equal(isLiabilityAccountType("vehicle"), false);
  assert.equal(isLiabilityAccountType("other_asset"), false);
});

test("pickDefaultAccountId: prioriza la cuenta de nómina sobre la primera de la lista", () => {
  const accounts = [
    { id: 1, name: "Cuenta de cheques" },
    { id: 2, name: "Nómina BBVA" },
    { id: 3, name: "Ahorros" },
  ];
  assert.equal(pickDefaultAccountId(accounts), 2);
});

test("pickDefaultAccountId: sin cuenta de nómina, usa la primera", () => {
  const accounts = [
    { id: 5, name: "Cuenta de cheques" },
    { id: 6, name: "Ahorros" },
  ];
  assert.equal(pickDefaultAccountId(accounts), 5);
});

test("pickDefaultAccountId: lista vacía devuelve null", () => {
  assert.equal(pickDefaultAccountId([]), null);
});

test("assertValidAccountName: rechaza nombre vacío o solo espacios", () => {
  assert.throws(() => assertValidAccountName(""), InvalidAccountError);
  assert.throws(() => assertValidAccountName("   "), InvalidAccountError);
});

test("assertValidAccountName: acepta nombre no vacío", () => {
  assert.doesNotThrow(() => assertValidAccountName("Cuenta de cheques"));
});

test("assertValidAccountType: rechaza tipo no soportado", () => {
  assert.throws(() => assertValidAccountType("crypto"), InvalidAccountError);
});

test("assertValidAccountType: acepta un tipo soportado", () => {
  assert.doesNotThrow(() => assertValidAccountType("checking"));
});

test("decideAccountRemoval: sin actividad se borra, con actividad se archiva", () => {
  assert.equal(decideAccountRemoval(0), "delete");
  assert.equal(decideAccountRemoval(1), "archive");
  assert.equal(decideAccountRemoval(50), "archive");
});

test("mergeAccountDetails: sin creditLimitCents deja los detalles existentes intactos", () => {
  assert.deepEqual(mergeAccountDetails({ foo: "bar" }, undefined), { foo: "bar" });
  assert.equal(mergeAccountDetails(null, undefined), null);
});

test("mergeAccountDetails: con creditLimitCents lo mezcla sobre los detalles existentes", () => {
  assert.deepEqual(mergeAccountDetails({ foo: "bar" }, 50000), { foo: "bar", creditLimitCents: 50000 });
  assert.deepEqual(mergeAccountDetails(null, 50000), { creditLimitCents: 50000 });
});

test("Tarjeta de débito es un tipo de cuenta válido, de activo (no de pasivo) y con etiqueta", () => {
  assert.ok(ACCOUNT_TYPES.includes("debit_card"));
  assert.doesNotThrow(() => assertValidAccountType("debit_card"));
  assert.equal(isLiabilityAccountType("debit_card"), false);
  assert.equal(ACCOUNT_TYPE_LABELS.debit_card, "Tarjeta de débito");
});

test("todos los tipos de cuenta tienen etiqueta en español", () => {
  for (const type of ACCOUNT_TYPES) assert.ok(ACCOUNT_TYPE_LABELS[type], `falta la etiqueta de ${type}`);
});
