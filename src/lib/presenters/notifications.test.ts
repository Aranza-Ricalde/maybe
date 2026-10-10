import assert from "node:assert/strict";
import { test } from "node:test";
import { NOTIFICATION_KINDS } from "@/domain/notifications/rules";
import { notificationAge, notificationPresentation, unreadBadge } from "./notifications";

const now = new Date("2026-10-10T12:00:00Z");

test("la antigüedad se dice en minutos, horas, ayer y días", () => {
  assert.equal(notificationAge("2026-10-10T11:59:40Z", now), "Ahora");
  assert.equal(notificationAge("2026-10-10T11:30:00Z", now), "Hace 30 min");
  assert.equal(notificationAge("2026-10-10T09:00:00Z", now), "Hace 3 h");
  assert.equal(notificationAge("2026-10-09T10:00:00Z", now), "Ayer");
  assert.equal(notificationAge("2026-10-05T12:00:00Z", now), "Hace 5 días");
});

test("el contador se oculta en cero y se topa en 9+", () => {
  assert.equal(unreadBadge(0), null);
  assert.equal(unreadBadge(4), "4");
  assert.equal(unreadBadge(25), "9+");
});

test("cada tipo de notificación tiene un tono", () => {
  for (const kind of NOTIFICATION_KINDS) assert.ok(notificationPresentation(kind).tone);
  assert.equal(notificationPresentation("payment_late").tone, "danger");
  assert.equal(notificationPresentation("pending_decisions").tone, "primary");
});
