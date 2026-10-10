import assert from "node:assert/strict";
import { test } from "node:test";
import { TRANSFER_CHOICES, categoryChoice, flowOfAmount, kindChoice } from "./reviewChoices";

test("un gasto puede ser transferencia, pago de tarjeta o de deuda; un ingreso solo transferencia", () => {
  assert.deepEqual(TRANSFER_CHOICES.expense, ["transfer", "cc_payment", "loan_payment"]);
  assert.deepEqual(TRANSFER_CHOICES.income, ["transfer"]);
});

test("las opciones se codifican como tipo:valor y el flujo sale del signo", () => {
  assert.equal(kindChoice("transfer"), "kind:transfer");
  assert.equal(categoryChoice(7), "category:7");
  assert.equal(flowOfAmount(-100), "expense");
  assert.equal(flowOfAmount(100), "income");
});
