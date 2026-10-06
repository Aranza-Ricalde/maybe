import assert from "node:assert/strict";
import { test } from "node:test";
import { debtDueEntries, type CalendarDebtInput, type CalendarDebtPayment } from "./debts";

const debt: CalendarDebtInput = { accountId: 42, name: "Deuda hey Banco", owedCents: 3_324_200, minimumPaymentCents: 300_000, paymentDueDay: 12 };
const pay = (date: string, amountCents: number, accountId = 42): CalendarDebtPayment => ({ accountId, date, amountCents, name: "Pago" });
const run = (payments: CalendarDebtPayment[], today = "2026-10-06", debts = [debt]) => debtDueEntries(debts, payments, today, "2026-09-29", "2026-10-14");

test("el vencimiento aparece en su fecha como pago mínimo esperado", () => {
  const [entry] = run([]);
  assert.equal(entry.name, "Pago mínimo · Deuda hey Banco");
  assert.equal(entry.source, "deuda");
  assert.equal(entry.expectedDate, "2026-10-12");
  assert.equal(entry.expectedAmountCents, -300_000);
  assert.equal(entry.status, "pending");
  assert.equal(entry.occurrenceId, null);
});

test("sin pago y ya vencido, está atrasado", () => {
  assert.equal(run([], "2026-10-13")[0].status, "overdue");
});

test("un pago que cubre el mínimo, dentro de la ventana, lo marca como pagado con el pago real", () => {
  const [entry] = run([pay("2026-10-03", 350_000)], "2026-10-13");
  assert.equal(entry.status, "paid");
  assert.equal(entry.actualAmountCents, 350_000);
  assert.equal(entry.actualDate, "2026-10-03");
});

test("varios pagos que juntos cubren el mínimo cuentan; uno menor al mínimo no", () => {
  assert.equal(run([pay("2026-10-02", 150_000), pay("2026-10-09", 150_000)])[0].status, "paid");
  assert.equal(run([pay("2026-10-02", 100_000)])[0].status, "pending");
});

test("pagos de otra cuenta o fuera de la ventana no cubren el vencimiento", () => {
  assert.equal(run([pay("2026-10-03", 350_000, 99)])[0].status, "pending");
  assert.equal(run([pay("2026-09-10", 350_000)])[0].status, "pending"); // más de 20 días antes
  assert.equal(run([pay("2026-10-20", 350_000)])[0].status, "pending"); // más de 5 días después
});

test("sin pago mínimo, sin día de pago, o sin deuda pendiente no hay vencimiento", () => {
  assert.deepEqual(run([], "2026-10-06", [{ ...debt, minimumPaymentCents: null }]), []);
  assert.deepEqual(run([], "2026-10-06", [{ ...debt, paymentDueDay: null }]), []);
  assert.deepEqual(run([], "2026-10-06", [{ ...debt, owedCents: 0 }]), []);
});

test("solo salen los vencimientos que caen dentro del periodo", () => {
  assert.deepEqual(debtDueEntries([{ ...debt, paymentDueDay: 20 }], [], "2026-10-06", "2026-09-29", "2026-10-14"), []);
  assert.equal(debtDueEntries([{ ...debt, paymentDueDay: 30 }], [], "2026-10-06", "2026-09-29", "2026-10-14").length, 1); // 30 de septiembre
});
