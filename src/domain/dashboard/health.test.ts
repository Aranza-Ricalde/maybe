import assert from "node:assert/strict";
import { test } from "node:test";
import { computeHealthScore, healthLevel } from "./health";

const base = { savingsRate: null, budgetUsage: null, debtToAssets: null, emergencyMonths: null, emergencyTargetMonths: 3, billsPaidRatio: null };

test("sin ningún dato no hay puntaje", () => {
  assert.equal(computeHealthScore(base), null);
});

test("cada factor se mide de 0 a 100 con su propia meta", () => {
  const result = computeHealthScore({ savingsRate: 0.1, budgetUsage: 1, debtToAssets: 0.35, emergencyMonths: 1.5, emergencyTargetMonths: 3, billsPaidRatio: 0.9 });
  assert.deepEqual(result?.factors, [
    { key: "savings", score: 50 },
    { key: "spending", score: 50 },
    { key: "debt", score: 50 },
    { key: "emergency", score: 50 },
    { key: "bills", score: 90 },
  ]);
  assert.equal(result?.score, 58);
  assert.equal(result?.level, "fair");
});

test("los extremos se recortan a 0 y 100 y el puntaje promedia solo lo que hay", () => {
  const result = computeHealthScore({ ...base, savingsRate: 0.5, budgetUsage: 2 });
  assert.deepEqual(result?.factors.map((factor) => factor.score), [100, 0]);
  assert.equal(result?.score, 50);
});

test("los niveles cortan en 40, 60 y 80", () => {
  assert.deepEqual([39, 40, 60, 80].map(healthLevel), ["poor", "fair", "good", "excellent"]);
});
