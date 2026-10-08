import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_STATS_PARAMS, activeFilterCount, normalizeStatsParams, parseStatsParams, serializeStatsParams, toStatsExplorerFilters } from "./params";

test("sin parámetros se usan los valores por defecto", () => {
  assert.deepEqual(parseStatsParams({}), DEFAULT_STATS_PARAMS);
  assert.equal(serializeStatsParams(DEFAULT_STATS_PARAMS), "");
});

test("valores inválidos caen al valor por defecto en vez de fallar", () => {
  const params = parseStatsParams({ m: "x", g: "y", r: "z", acc: "-3", cat: "abc", nat: "otra", from: "mañana" });
  assert.deepEqual(params, DEFAULT_STATS_PARAMS);
});

test("agrupar por cuenta solo vale con saldo, y por categoría o comercio solo con gasto", () => {
  assert.equal(normalizeStatsParams({ ...DEFAULT_STATS_PARAMS, metric: "income", group: "category" }).group, "time");
  assert.equal(normalizeStatsParams({ ...DEFAULT_STATS_PARAMS, metric: "expense", group: "account" }).group, "time");
  assert.equal(normalizeStatsParams({ ...DEFAULT_STATS_PARAMS, metric: "balance", group: "account" }).group, "account");
});

test("la proyección solo aplica a saldo en el tiempo y sin filtro de cuenta; comparar no aplica a saldo", () => {
  const balance = { ...DEFAULT_STATS_PARAMS, metric: "balance" as const, group: "time" as const, projection: true };
  assert.equal(normalizeStatsParams(balance).projection, true);
  assert.equal(normalizeStatsParams({ ...balance, accountId: 4 }).projection, false);
  assert.equal(normalizeStatsParams({ ...balance, compare: true }).compare, false);
  assert.equal(normalizeStatsParams({ ...DEFAULT_STATS_PARAMS, projection: true }).projection, false);
});

test("un rango personalizado necesita fechas válidas; si no, vuelve al preset por defecto", () => {
  assert.equal(normalizeStatsParams({ ...DEFAULT_STATS_PARAMS, preset: "custom" }).preset, "6m");
  const ok = normalizeStatsParams({ ...DEFAULT_STATS_PARAMS, preset: "custom", from: "2026-01-01", to: "2026-02-01" });
  assert.equal(ok.preset, "custom");
  assert.equal(normalizeStatsParams({ ...DEFAULT_STATS_PARAMS, preset: "3m", from: "2026-01-01", to: "2026-02-01" }).from, null);
});

test("serializar y leer devuelve los mismos parámetros", () => {
  const params = normalizeStatsParams({ ...DEFAULT_STATS_PARAMS, metric: "balance", group: "time", preset: "custom", from: "2026-01-01", to: "2026-03-01", projection: true, categoryId: 5, merchant: "Netflix", nature: "essential" });
  const text = serializeStatsParams(params);
  assert.deepEqual(parseStatsParams(Object.fromEntries(new URLSearchParams(text))), params);
});

test("los filtros del explorador salen del rango resuelto y cuentan los filtros activos", () => {
  const params = { ...DEFAULT_STATS_PARAMS, accountId: 3, merchant: "Uber" };
  const filters = toStatsExplorerFilters(params, "2026-10-07", null);
  assert.equal(filters.to, "2026-10-07");
  assert.equal(filters.accountId, 3);
  assert.equal(activeFilterCount(params), 2);
});
