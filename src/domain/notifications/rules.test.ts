import assert from "node:assert/strict";
import { test } from "node:test";
import type { CalendarEntry } from "@/domain/calendar/rules";
import { telegramHtml, planBudgetNotifications, planNotifications, planPaymentNotifications, shouldNotifyCashNegative, shouldNotifyPending } from "./rules";

const entry = (overrides: Partial<CalendarEntry>): CalendarEntry => ({
  occurrenceId: 1,
  name: "Netflix",
  flow: "expense",
  source: "recurrente",
  expectedDate: "2026-10-12",
  expectedAmountCents: 22900,
  status: "pending",
  isManual: false,
  actualName: null,
  actualDate: null,
  actualAmountCents: null,
  ...overrides,
});

test("un pago avisa 2 días antes, el día y cuando está atrasado, y nada entre medias", () => {
  const today = "2026-10-10";
  assert.equal(planPaymentNotifications([entry({ expectedDate: "2026-10-12" })], today)[0].dedupeKey, "due2:o1");
  assert.equal(planPaymentNotifications([entry({ expectedDate: "2026-10-10" })], today)[0].dedupeKey, "due0:o1");
  assert.equal(planPaymentNotifications([entry({ expectedDate: "2026-10-08" })], today)[0].kind, "payment_late");
  assert.equal(planPaymentNotifications([entry({ expectedDate: "2026-10-11" })], today).length, 0);
  assert.equal(planPaymentNotifications([entry({ expectedDate: "2026-10-20" })], today).length, 0);
});

test("lo pagado, omitido o de ingreso no avisa", () => {
  const today = "2026-10-10";
  assert.equal(planPaymentNotifications([entry({ status: "paid", expectedDate: "2026-10-10" })], today).length, 0);
  assert.equal(planPaymentNotifications([entry({ status: "skipped", expectedDate: "2026-10-10" })], today).length, 0);
  assert.equal(planPaymentNotifications([entry({ flow: "income", expectedDate: "2026-10-10" })], today).length, 0);
});

test("el presupuesto avisa al 80 % y al pasarse, una vez por periodo, y ignora ahorro y sin presupuesto", () => {
  const line = { categoryId: 4, name: "Ocio", budgetCents: 100_000, spentCents: -85_000, isSavings: false };
  assert.deepEqual(planBudgetNotifications([line], "2026-09-29").map((n) => n.dedupeKey), ["budget80:4:2026-09-29"]);
  assert.deepEqual(planBudgetNotifications([{ ...line, spentCents: -120_000 }], "2026-09-29").map((n) => n.dedupeKey), ["budget100:4:2026-09-29"]);
  assert.equal(planBudgetNotifications([{ ...line, spentCents: -50_000 }], "2026-09-29").length, 0);
  assert.equal(planBudgetNotifications([{ ...line, isSavings: true }], "2026-09-29").length, 0);
  assert.equal(planBudgetNotifications([{ ...line, budgetCents: 0 }], "2026-09-29").length, 0);
});

test("el disponible negativo avisa al entrar y no se repite a diario", () => {
  const last = { createdAt: "2026-10-08T14:00:00Z", resolved: false, payload: { deficitCents: 100_000 } };
  assert.equal(shouldNotifyCashNegative(-100_000, null, "2026-10-08"), true);
  assert.equal(shouldNotifyCashNegative(-100_000, last, "2026-10-09"), false);
  assert.equal(shouldNotifyCashNegative(-110_000, last, "2026-10-09"), false);
  assert.equal(shouldNotifyCashNegative(-160_000, last, "2026-10-09"), true);
  assert.equal(shouldNotifyCashNegative(-100_000, last, "2026-10-15"), true);
  assert.equal(shouldNotifyCashNegative(500, last, "2026-10-09"), false);
});

test("si el disponible ya se recuperó, volver a negativo es un aviso nuevo", () => {
  const last = { createdAt: "2026-10-08T14:00:00Z", resolved: true, payload: { deficitCents: 100_000 } };
  assert.equal(shouldNotifyCashNegative(-20_000, last, "2026-10-09"), true);
});

test("los pendientes avisan si hay más que la última vez o pasaron 3 días", () => {
  const last = { createdAt: "2026-10-08T14:00:00Z", resolved: false, payload: { count: 2 } };
  assert.equal(shouldNotifyPending(0, null, "2026-10-09"), false);
  assert.equal(shouldNotifyPending(2, null, "2026-10-09"), true);
  assert.equal(shouldNotifyPending(2, last, "2026-10-09"), false);
  assert.equal(shouldNotifyPending(3, last, "2026-10-09"), true);
  assert.equal(shouldNotifyPending(2, last, "2026-10-11"), true);
});

test("planNotifications junta todo sin duplicar claves", () => {
  const planned = planNotifications({
    today: "2026-10-10",
    periodStart: "2026-09-29",
    entries: [entry({ expectedDate: "2026-10-10" })],
    budgetLines: [{ categoryId: 4, name: "Ocio", budgetCents: 100_000, spentCents: -120_000, isSavings: false }],
    availableCents: -5_000,
    pendingDecisions: 2,
    lastCash: null,
    lastPending: null,
  });
  const keys = planned.map((n) => n.dedupeKey);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(planned.length, 4);
});

test("el mensaje de Telegram lleva emoji, título en negritas y escapa HTML", () => {
  assert.equal(telegramHtml({ kind: "payment_due", title: "Hoy vence: Luz", body: "$600.00 por pagar hoy." }), "🗓 <b>Hoy vence: Luz</b>\n$600.00 por pagar hoy.");
  assert.equal(telegramHtml({ kind: "budget_exceeded", title: "Te pasaste en <Ocio> & más", body: "a < b" }), "🚨 <b>Te pasaste en &lt;Ocio&gt; &amp; más</b>\na &lt; b");
});
