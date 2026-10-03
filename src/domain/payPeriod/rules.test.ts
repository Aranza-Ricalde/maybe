import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  defaultPayDate,
  findPeriodIndexContaining,
  generateSuggestedPeriods,
  isBusinessDay,
  nextOccurrenceOnOrAfter,
  periodLabel,
  periodLengthDays,
  previousBusinessDayBefore,
  rangeFromPeriods,
  resolveDayOfMonthWithinRange,
} from "./rules";

test("isBusinessDay: identifica fines de semana correctamente", () => {
  assert.equal(isBusinessDay("2026-09-14"), true);
  assert.equal(isBusinessDay("2026-09-19"), false);
  assert.equal(isBusinessDay("2026-09-20"), false);
});

test("defaultPayDate: coincide exacto con las 10 fechas de nómina reales del usuario (may-sep 2026)", () => {
  const casos: [string, string][] = [
    ["2026-05-15", "2026-05-14"],
    ["2026-05-31", "2026-05-29"],
    ["2026-06-15", "2026-06-12"],
    ["2026-06-30", "2026-06-29"],
    ["2026-07-15", "2026-07-14"],
    ["2026-07-31", "2026-07-30"],
    ["2026-08-15", "2026-08-14"],
    ["2026-08-31", "2026-08-28"],
    ["2026-09-15", "2026-09-14"],
    ["2026-09-30", "2026-09-29"],
  ];
  for (const [nominal, esperado] of casos) {
    assert.equal(defaultPayDate(nominal), esperado, `nominal ${nominal} debía dar ${esperado}`);
  }
});

test("previousBusinessDayBefore: nunca regresa el mismo día aunque ya sea hábil", () => {
  assert.equal(previousBusinessDayBefore("2026-09-14"), "2026-09-11");
});

test("generateSuggestedPeriods: genera periodos consecutivos a partir de una fecha", () => {
  const periods = generateSuggestedPeriods("2026-09-20", 4);
  assert.equal(periods.length, 4);
  assert.deepEqual(periods[0], { start: "2026-09-29", end: "2026-10-13" });
  assert.deepEqual(periods[1], { start: "2026-10-14", end: "2026-10-29" });
  assert.equal(periods[2].start, "2026-10-30");
  assert.equal(periods[3].start > periods[2].start, true);
});

test("findPeriodIndexContaining: ubica el índice del periodo que contiene una fecha", () => {
  const periods = generateSuggestedPeriods("2026-09-01", 6);
  const idx = findPeriodIndexContaining(periods, "2026-10-05");
  assert.equal(periods[idx].start <= "2026-10-05", true);
  assert.equal(periods[idx].end >= "2026-10-05", true);
});

test("findPeriodIndexContaining: devuelve -1 si ningún periodo contiene la fecha", () => {
  const periods = generateSuggestedPeriods("2026-09-01", 2);
  assert.equal(findPeriodIndexContaining(periods, "2030-01-01"), -1);
});

test("rangeFromPeriods: une varios periodos en un solo rango", () => {
  const periods = generateSuggestedPeriods("2026-09-20", 3);
  const range = rangeFromPeriods(periods);
  assert.equal(range.start, periods[0].start);
  assert.equal(range.end, periods[2].end);
});

test("rangeFromPeriods: un solo periodo da el mismo rango", () => {
  const periods = generateSuggestedPeriods("2026-09-20", 1);
  const range = rangeFromPeriods(periods);
  assert.deepEqual(range, periods[0]);
});

test("periodLengthDays: cuenta los días inclusive", () => {
  assert.equal(periodLengthDays({ start: "2026-09-14", end: "2026-09-28" }), 15);
});

test("periodLabel: formatea un rango legible", () => {
  assert.equal(periodLabel("2026-09-14", "2026-09-28"), "14 sep – 28 sep");
});

test("resolveDayOfMonthWithinRange: encuentra el día dentro del rango cuando no cruza de mes", () => {
  assert.equal(resolveDayOfMonthWithinRange(20, "2026-09-14", "2026-09-28"), "2026-09-20");
  assert.equal(resolveDayOfMonthWithinRange(5, "2026-09-14", "2026-09-28"), null);
});

test("resolveDayOfMonthWithinRange: encuentra el día correcto cuando el rango cruza de mes", () => {
  assert.equal(resolveDayOfMonthWithinRange(30, "2026-09-29", "2026-10-13"), "2026-09-30");
  assert.equal(resolveDayOfMonthWithinRange(5, "2026-09-29", "2026-10-13"), "2026-10-05");
});

test("resolveDayOfMonthWithinRange: recorta al último día cuando el mes no tiene ese día", () => {
  assert.equal(resolveDayOfMonthWithinRange(31, "2026-09-25", "2026-10-13"), "2026-09-30");
});

test("resolveDayOfMonthWithinRange: devuelve null cuando el día no cae en ninguno de los dos meses del rango", () => {
  assert.equal(resolveDayOfMonthWithinRange(15, "2026-09-29", "2026-10-13"), null);
});

test("nextOccurrenceOnOrAfter: encuentra el día dentro del mismo mes cuando todavía no pasa", () => {
  assert.equal(nextOccurrenceOnOrAfter(20, "2026-09-14"), "2026-09-20");
});

test("nextOccurrenceOnOrAfter: salta al mes siguiente cuando el día ya pasó en el mes de referencia", () => {
  assert.equal(nextOccurrenceOnOrAfter(15, "2026-09-29"), "2026-10-15");
});

test("nextOccurrenceOnOrAfter: nunca desaparece aunque caiga fuera de una quincena corta", () => {
  assert.equal(nextOccurrenceOnOrAfter(15, "2026-09-29"), "2026-10-15");
  assert.equal(nextOccurrenceOnOrAfter(30, "2026-09-29"), "2026-09-30");
});

test("addDays: cruza correctamente el límite de mes", () => {
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-10-01", -1), "2026-09-30");
});
