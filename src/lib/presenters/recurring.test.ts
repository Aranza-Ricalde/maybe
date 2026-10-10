import assert from "node:assert/strict";
import { test } from "node:test";
import { recurringDetailLabel } from "./recurring";

test("muestra solo lo que existe, sin guiones sobrantes", () => {
  assert.equal(recurringDetailLabel("Nu Débito", "Servicios"), "Nu Débito · Servicios");
  assert.equal(recurringDetailLabel(undefined, "Telefonía"), "Telefonía");
  assert.equal(recurringDetailLabel("Nu Débito", undefined), "Nu Débito");
  assert.equal(recurringDetailLabel(undefined, undefined), "Sin cuenta ni categoría");
});

import { PERIOD_START_DAY } from "@/domain/payPeriod/rules";
import { recurringBucket, sortByNextOccurrence } from "./recurring";

test("los recurrentes se agrupan por cuándo toca el siguiente cobro o pago", () => {
  assert.equal(recurringBucket(10, "2026-10-08"), "Esta semana");
  assert.equal(recurringBucket(20, "2026-10-08"), "Este mes");
  assert.equal(recurringBucket(3, "2026-10-08"), "Próximo mes");
  assert.equal(recurringBucket(PERIOD_START_DAY, "2026-10-08"), "Cada periodo");
  assert.equal(recurringBucket(2, "2026-10-28"), "Esta semana");
});

test("se ordenan por lo que sigue primero y los de inicio de periodo van al final", () => {
  const rows = [{ dayOfMonth: 3 }, { dayOfMonth: PERIOD_START_DAY }, { dayOfMonth: 20 }, { dayOfMonth: 10 }];
  assert.deepEqual(sortByNextOccurrence(rows, "2026-10-08").map((row) => row.dayOfMonth), [10, 20, 3, PERIOD_START_DAY]);
});
