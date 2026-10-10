import assert from "node:assert/strict";
import { test } from "node:test";
import { transferHint } from "./nature";

const OWNERS = ["Rafael"];

test("la nota decide pago de tarjeta o de deuda (solo salidas)", () => {
  assert.deepEqual(transferHint("SPEI ENVIADO ARCUS FI – tdc plata", -46_304, OWNERS)?.kind, "cc_payment");
  assert.equal(transferHint("SPEI ENVIADO CONSUBANCO – deuda", -30_000, OWNERS)?.kind, "loan_payment");
  assert.equal(transferHint("SPEI RECIBIDO STP – tdc", 10_000, OWNERS)?.nature, "unclear");
});

test("tu propio nombre indica transferencia entre tus cuentas", () => {
  const hint = transferHint("Rafael Perea Transferencia", -4_524, OWNERS);
  assert.equal(hint?.nature, "internal");
  assert.equal(hint?.kind, "transfer");
});

test("pago a cuenta de tercero es externo y cuenta como gasto", () => {
  const hint = transferHint("PAGO CUENTA DE TERCERO – lavanderia", -27_800, OWNERS);
  assert.equal(hint?.nature, "external");
  assert.equal(hint?.kind, null);
  assert.equal(transferHint("PAGO CUENTA DE TERCERO – regalos", 40_000, OWNERS)?.nature, "external");
});

test("SPEI a una institución sin más pistas queda sin clasificar, nombrando la institución", () => {
  const hint = transferHint("SPEI ENVIADO NU MEXICO", -10_000, OWNERS);
  assert.equal(hint?.nature, "unclear");
  assert.match(hint?.reason ?? "", /Nu México/);
  assert.equal(transferHint("SPEI RECIBIDO NU MEXICO", 15_400, OWNERS)?.nature, "unclear");
});

test("una compra normal no es transferencia", () => {
  assert.equal(transferHint("OXXO MONARCA MID", -9_900, OWNERS), null);
  assert.equal(transferHint("DLO DIDI RIDES MX", -3_700, OWNERS), null);
});

test("la compensación por retraso de un SPEI no es transferencia", () => {
  assert.equal(transferHint("Compensación de retraso SPEI", 1, OWNERS), null);
});
