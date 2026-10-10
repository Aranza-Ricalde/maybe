import assert from "node:assert/strict";
import { test } from "node:test";
import { pushAvailability, urlBase64ToBytes, type PushEnvironment } from "./push";

const base: PushEnvironment = { supported: true, isIos: false, isStandalone: false, hasPublicKey: true, permission: "default", subscribed: false };

test("sin llave del servidor no se ofrece activar", () => {
  assert.equal(pushAvailability({ ...base, hasPublicKey: false }), "not-configured");
});

test("en iPhone solo funciona desde la app agregada a inicio", () => {
  assert.equal(pushAvailability({ ...base, isIos: true, supported: false }), "needs-install");
  assert.equal(pushAvailability({ ...base, isIos: true, isStandalone: true }), "ready");
});

test("distingue no compatible, bloqueado, listo y suscrito", () => {
  assert.equal(pushAvailability({ ...base, supported: false }), "unsupported");
  assert.equal(pushAvailability({ ...base, permission: "denied" }), "denied");
  assert.equal(pushAvailability(base), "ready");
  assert.equal(pushAvailability({ ...base, permission: "granted", subscribed: true }), "subscribed");
  assert.equal(pushAvailability({ ...base, permission: "granted", subscribed: false }), "ready");
});

test("decodifica base64url a bytes", () => {
  assert.deepEqual([...urlBase64ToBytes("AQID")], [1, 2, 3]);
  assert.deepEqual([...urlBase64ToBytes("-_8")], [251, 255]);
});
