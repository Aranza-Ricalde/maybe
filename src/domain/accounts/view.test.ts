import assert from "node:assert/strict";
import { test } from "node:test";
import { accountRowsView } from "./view";

test("accountRowsView: junta saldo, límite de crédito y condiciones de deuda de cada cuenta", () => {
  const rows = accountRowsView(
    [
      { id: 1, name: "Nu TDC", type: "credit_card", details: { creditLimitCents: 5_000_000, annualRatePct: 60 } },
      { id: 2, name: "Efectivo", type: "cash", details: null },
    ],
    new Map([[1, -80_000]]),
  );
  assert.equal(rows[0].balanceCents, -80_000);
  assert.equal(rows[0].creditLimitCents, 5_000_000);
  assert.equal(rows[0].debtTerms.annualRatePct, 60);
  assert.equal(rows[1].balanceCents, 0);
  assert.equal(rows[1].creditLimitCents, null);
});
