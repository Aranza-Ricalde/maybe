import assert from "node:assert/strict";
import { test } from "node:test";
import { mondayOf, weeklyFlow, type DailyFlowInput } from "./weekly";

const day = (date: string, incomeCents: number, expenseCents: number): DailyFlowInput => ({ date, incomeCents, expenseCents });

test("el lunes de cada fecha (el 6 de octubre de 2026 es martes)", () => {
  assert.equal(mondayOf("2026-10-06"), "2026-10-05");
  assert.equal(mondayOf("2026-10-05"), "2026-10-05");
  assert.equal(mondayOf("2026-10-11"), "2026-10-05"); // domingo
  assert.equal(mondayOf("2026-10-12"), "2026-10-12");
});

test("agrupa por semana de lunes a domingo, recortando la primera y la última al periodo", () => {
  const days = [
    day("2026-09-29", 0, -10_000), day("2026-09-30", 100_000, 0), day("2026-10-04", 0, -20_000), // semana del 28 sep (solo 29 sep – 4 oct del periodo)
    day("2026-10-05", 0, -5_000), day("2026-10-11", 50_000, -1_000), // semana del 5 oct
    day("2026-10-12", 0, -7_000), day("2026-10-14", 0, -3_000), // semana del 12 oct (recortada al 14)
  ];
  const weeks = weeklyFlow(days, "2026-09-29", "2026-10-14");
  assert.deepEqual(weeks.map((w) => [w.from, w.to]), [["2026-09-29", "2026-10-04"], ["2026-10-05", "2026-10-11"], ["2026-10-12", "2026-10-14"]]);
  assert.deepEqual(weeks.map((w) => [w.incomeCents, w.expenseCents, w.netCents]), [[100_000, 30_000, 70_000], [50_000, 6_000, 44_000], [0, 10_000, -10_000]]);
});

test("la suma de las semanas es exactamente el flujo del periodo", () => {
  const real = [day("2026-09-29", 10, -4), day("2026-10-03", 20, -6), day("2026-10-08", 30, -8), day("2026-10-14", 40, -10)];
  const weeks = weeklyFlow(real, "2026-09-29", "2026-10-14");
  assert.equal(weeks.reduce((s, w) => s + w.incomeCents, 0), 100);
  assert.equal(weeks.reduce((s, w) => s + w.expenseCents, 0), 28);
  assert.equal(weeks.reduce((s, w) => s + w.netCents, 0), 72);
});

test("los días fuera del periodo se ignoran y sin días no hay semanas", () => {
  assert.deepEqual(weeklyFlow([day("2026-09-01", 100, -100)], "2026-09-29", "2026-10-14"), []);
  assert.deepEqual(weeklyFlow([], "2026-09-29", "2026-10-14"), []);
});
