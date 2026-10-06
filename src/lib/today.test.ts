import assert from "node:assert/strict";
import { test } from "node:test";
import { todayIso } from "./today";

test("a las 22:00 de Ciudad de México (04:00 UTC del día siguiente) todavía es el mismo día", () => {
  assert.equal(todayIso(new Date("2026-10-07T04:00:00Z"), "America/Mexico_City"), "2026-10-06");
});

test("a media mañana local coincide con la fecha UTC", () => {
  assert.equal(todayIso(new Date("2026-10-06T16:00:00Z"), "America/Mexico_City"), "2026-10-06");
});

import { currentHour } from "./today";

test("currentHour: usa la hora de la zona de la familia, no la del servidor", () => {
  assert.equal(currentHour(new Date("2026-10-07T04:00:00Z"), "America/Mexico_City"), 22);
  assert.equal(currentHour(new Date("2026-10-06T16:30:00Z"), "America/Mexico_City"), 10);
});
