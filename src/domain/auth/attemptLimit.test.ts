import assert from "node:assert/strict";
import { test } from "node:test";
import { decideAttempt, recentFailures } from "./attemptLimit";

const POLICY = { maxFailures: 3, windowMs: 1000 };

test("decideAttempt: bajo el máximo de fallos permite intentar", () => {
  assert.deepEqual(decideAttempt([100, 200], 500, POLICY), { allowed: true, retryAfterMs: 0 });
});

test("decideAttempt: al llegar al máximo bloquea hasta que el fallo más antiguo salga de la ventana", () => {
  const decision = decideAttempt([100, 200, 300], 500, POLICY);
  assert.equal(decision.allowed, false);
  assert.equal(decision.retryAfterMs, 600);
});

test("decideAttempt: los fallos fuera de la ventana ya no cuentan", () => {
  assert.equal(decideAttempt([100, 200, 300], 1500, POLICY).allowed, true);
});

test("recentFailures: descarta lo antiguo", () => {
  assert.deepEqual(recentFailures([0, 900, 1200], 1500, 1000), [900, 1200]);
});
