import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { DEFAULT_DURATION_MS, MAX_VISIBLE_NOTIFICATIONS, dismissNotification, getNotifications, notify, pushNotification, resetNotifications, subscribeNotifications } from "./notifications";

afterEach(resetNotifications);

test("cada tipo usa su duración por defecto y los errores duran más que los éxitos", () => {
  notify.success("a");
  notify.error("b");
  assert.deepEqual(getNotifications().map((n) => [n.status, n.durationMs]), [["success", DEFAULT_DURATION_MS.success], ["danger", DEFAULT_DURATION_MS.danger]]);
  assert.ok(DEFAULT_DURATION_MS.danger > DEFAULT_DURATION_MS.success);
});

test("se puede fijar la duración y descartar una notificación", () => {
  const id = pushNotification({ title: "x", durationMs: 1000 });
  assert.equal(getNotifications()[0].durationMs, 1000);
  dismissNotification(id);
  assert.deepEqual(getNotifications(), []);
});

test("solo quedan las más recientes cuando se acumulan", () => {
  for (let i = 0; i < MAX_VISIBLE_NOTIFICATIONS + 2; i++) notify.info(`n${i}`);
  assert.equal(getNotifications().length, MAX_VISIBLE_NOTIFICATIONS);
  assert.equal(getNotifications().at(-1)?.title, `n${MAX_VISIBLE_NOTIFICATIONS + 1}`);
});

test("los suscriptores se avisan al agregar y al descartar, y dejan de avisarse al cancelar", () => {
  let calls = 0;
  const unsubscribe = subscribeNotifications(() => calls++);
  const id = notify.success("a");
  dismissNotification(id);
  unsubscribe();
  notify.success("b");
  assert.equal(calls, 2);
});
