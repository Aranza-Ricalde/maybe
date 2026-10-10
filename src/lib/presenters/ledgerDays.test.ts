import assert from "node:assert/strict";
import { test } from "node:test";
import { dayNetCents } from "./ledgerDays";

test("el neto del día ignora transferencias, pagos de tarjeta y ajustes", () => {
  const rows = [
    { kind: "standard", amountCents: -500 },
    { kind: "standard", amountCents: 2000 },
    { kind: "transfer", amountCents: -9000 },
    { kind: "cc_payment", amountCents: -100 },
  ];
  assert.equal(dayNetCents(rows), 1500);
});
