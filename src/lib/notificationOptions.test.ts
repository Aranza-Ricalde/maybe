import assert from "node:assert/strict";
import { test } from "node:test";
import { NOTIFICATION_DURATION_MS, notificationOptions } from "./notificationOptions";

test("cada tipo usa su duración por defecto y los errores duran más que los éxitos", () => {
  assert.equal(notificationOptions("success").duration, NOTIFICATION_DURATION_MS.success);
  assert.equal(notificationOptions("error").duration, NOTIFICATION_DURATION_MS.error);
  assert.ok(NOTIFICATION_DURATION_MS.error > NOTIFICATION_DURATION_MS.success);
});

test("se puede fijar la duración y se conserva la descripción", () => {
  assert.deepEqual(notificationOptions("info", "detalle", 1000), { description: "detalle", duration: 1000 });
});
