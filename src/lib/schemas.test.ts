import assert from "node:assert/strict";
import { test } from "node:test";
import { accountPageArgs, budgetLineForm, goalForm, minimumBalanceForm, recurringItemForm, transactionFiltersArg, transactionForm, transferForm } from "./schemas";
import { parseForm, parseValue } from "./forms";

function form(entries: Array<[string, string]>): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

const VALID_TX: Array<[string, string]> = [["accountId", "3"], ["categoryId", ""], ["amount", "-123.45"], ["name", "Tacos"], ["date", "2026-10-06"]];

test("transactionForm: acepta un gasto válido y deja la categoría en null si viene vacía", () => {
  assert.deepEqual(parseForm(form(VALID_TX), transactionForm), { accountId: 3, categoryId: null, amountCents: -12345, name: "Tacos", date: "2026-10-06" });
});

test("transactionForm: rechaza monto cero, fecha inexistente, nombre larguísimo y cuenta inválida", () => {
  const withField = (key: string, value: string) => VALID_TX.map(([k, v]) => (k === key ? [k, value] : [k, v])) as Array<[string, string]>;
  assert.equal(parseForm(form(withField("amount", "0")), transactionForm), null);
  assert.equal(parseForm(form(withField("date", "2026-02-30")), transactionForm), null);
  assert.equal(parseForm(form(withField("name", "x".repeat(201))), transactionForm), null);
  assert.equal(parseForm(form(withField("accountId", "abc")), transactionForm), null);
});

test("transferForm: tipos permitidos y notas vacías como null", () => {
  const base: Array<[string, string]> = [["kind", "cc_payment"], ["fromAccountId", "1"], ["toAccountId", "2"], ["amount", "500"], ["date", "2026-10-06"], ["notes", ""]];
  assert.equal(parseForm(form(base), transferForm)?.notes, null);
  assert.equal(parseForm(form([["kind", "inventado"], ...base.slice(1)]), transferForm), null);
});

test("goalForm: acumula varias cuentas y acepta fecha vacía", () => {
  const data = parseForm(form([["name", "Viaje"], ["targetAmount", "5000"], ["targetDate", ""], ["accountIds", "1"], ["accountIds", "2"]]), goalForm);
  assert.deepEqual(data, { name: "Viaje", targetAmountCents: 500000, targetDate: null, accountIds: [1, 2] });
});

test("budgetLineForm y recurringItemForm validan enumeraciones y rangos", () => {
  assert.equal(parseForm(form([["categoryId", "1"], ["cadence", "daily"], ["amount", "10"]]), budgetLineForm), null);
  assert.notEqual(parseForm(form([["categoryId", "1"], ["cadence", "monthly"], ["amount", "10"]]), budgetLineForm), null);
  assert.equal(parseForm(form([["name", "Luz"], ["flow", "expense"], ["estimatedAmount", "450"], ["dayOfMonth", "32"], ["categoryId", ""], ["accountId", ""]]), recurringItemForm), null);
});

test("argumentos de páginas: tamaño máximo 100 y filtros con tipos estrictos", () => {
  assert.equal(parseValue({ accountId: 1, fromDate: "2026-09-01", toDate: "2026-10-01", page: 1, pageSize: 101 }, accountPageArgs), null);
  assert.notEqual(parseValue({ accountId: 1, fromDate: "2026-09-01", toDate: "2026-10-01", page: 1, pageSize: 10 }, accountPageArgs), null);
  assert.equal(parseValue({ search: "x".repeat(101) }, transactionFiltersArg), null);
  assert.equal(parseValue({ kindGroup: "otro" }, transactionFiltersArg), null);
});

test("minimumBalanceForm: número finito dentro de rango", () => {
  assert.deepEqual(parseForm(form([["minimum", " 5000 "]]), minimumBalanceForm), { minimum: 5000 });
  assert.equal(parseForm(form([["minimum", ""]]), minimumBalanceForm), null);
  assert.equal(parseForm(form([["minimum", "abc"]]), minimumBalanceForm), null);
});
