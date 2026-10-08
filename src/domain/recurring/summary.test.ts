import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeRecurring } from "./summary";

test("suma solo los recurrentes activos, sin importar el signo guardado", () => {
  const summary = summarizeRecurring([
    { flow: "income", estimatedAmountCents: 2000000, status: "active" },
    { flow: "expense", estimatedAmountCents: -600000, status: "active" },
    { flow: "expense", estimatedAmountCents: 50000, status: "active" },
    { flow: "expense", estimatedAmountCents: -999999, status: "paused" },
  ]);
  assert.deepEqual(summary, { incomeCents: 2000000, expenseCents: 650000, netCents: 1350000, activeCount: 3 });
});

test("sin recurrentes todo es cero", () => {
  assert.deepEqual(summarizeRecurring([]), { incomeCents: 0, expenseCents: 0, netCents: 0, activeCount: 0 });
});

test("un recurrente anclado al inicio de cada periodo cuenta dos veces al mes", () => {
  const summary = summarizeRecurring([{ flow: "income", estimatedAmountCents: 1500000, status: "active", dayOfMonth: 0 }]);
  assert.equal(summary.incomeCents, 3000000);
});
