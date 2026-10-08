import assert from "node:assert/strict";
import { test } from "node:test";
import type { StatsData } from "@/application/getStats";
import type { CategoryStats } from "@/domain/categoryStats/rules";
import type { ExplorerResult } from "@/domain/explorer/rules";
import { DEFAULT_STATS_PARAMS, type StatsParams } from "@/domain/stats/params";
import { bucketLabel, buildStatsChart, buildStatsMetrics, buildStatsTable, filterStatsRows, isEmptyChart } from "./stats";

const explorer: ExplorerResult = {
  from: "2026-08-01",
  to: "2026-09-30",
  bucket: "month",
  incomeCents: 200_00,
  expenseCents: 150_00,
  count: 5,
  series: [
    { key: "2026-08-01", incomeCents: 100_00, expenseCents: 50_00 },
    { key: "2026-09-01", incomeCents: 100_00, expenseCents: 100_00 },
  ],
  previousSeries: [
    { key: "2026-06-01", incomeCents: 0, expenseCents: 30_00 },
    { key: "2026-07-01", incomeCents: 0, expenseCents: 40_00 },
  ],
  stacked: {
    keys: [
      { key: "c1", label: "Casa", categoryId: 1, color: "#111111" },
      { key: "others", label: "Otras", categoryId: null, color: null },
    ],
    points: [
      { bucket: "2026-08-01", c1: 30_00, others: 20_00 },
      { bucket: "2026-09-01", c1: 90_00, others: 10_00 },
    ],
  },
  byCategory: [],
  drillParent: null,
  byMerchant: [{ key: "Netflix", categoryId: null, name: "Netflix", color: null, totalCents: 15_00, count: 1, share: 0.1 }],
  unidentified: { totalCents: 135_00, count: 4, share: 0.9 },
  merchantOptions: [],
  comparison: { from: "2026-06-01", to: "2026-07-31", expenseCents: 70_00, incomeCents: 0, deltaExpenseCents: 80_00, deltaExpensePct: 80 / 70, drivers: [{ name: "Casa", categoryId: 1, deltaCents: 60_00 }] },
  balance: [
    { date: "2026-09-29", balanceCents: 1000_00 },
    { date: "2026-09-30", balanceCents: 1200_00 },
  ],
};

const data: StatsData = { explorer, projection: null, accounts: null };
const stats = { totals: { avgLast3Cents: 50_00 } } as CategoryStats;
const params = (patch: Partial<StatsParams>): StatsParams => ({ ...DEFAULT_STATS_PARAMS, ...patch });

test("las etiquetas del eje dependen de la agrupación del tiempo", () => {
  assert.equal(bucketLabel("2026-09-01", "month"), "sep 26");
  assert.match(bucketLabel("2026-09-07", "week"), /^Sem\. /);
});

test("gasto en el tiempo: barras con el periodo anterior alineado por posición cuando se compara", () => {
  const chart = buildStatsChart(params({ metric: "expense", group: "time", compare: true }), data);
  assert.equal(chart.kind, "bars");
  assert.deepEqual(chart.data.map((row) => [row.value, row.previous]), [[50_00, 30_00], [100_00, 40_00]]);
  assert.deepEqual(chart.series.map((series) => series.key), ["value", "previous"]);
});

test("neto en el tiempo es ingreso menos gasto", () => {
  const chart = buildStatsChart(params({ metric: "net", group: "time" }), data);
  assert.deepEqual(chart.data.map((row) => row.value), [50_00, 0]);
});

test("por categoría: barras apiladas con el color de la categoría y 'Otras' en gris", () => {
  const chart = buildStatsChart(params({ group: "category" }), data);
  assert.equal(chart.series.every((series) => series.stacked), true);
  assert.equal(chart.series[0].color, "color-mix(in oklab, var(--primary) 100%, var(--card))");
  assert.match(chart.series[1].color, /muted-foreground/);
  assert.equal(chart.data[1].c1, 90_00);
});

test("por comercio: ranking horizontal", () => {
  const chart = buildStatsChart(params({ group: "merchant" }), data);
  assert.equal(chart.kind, "ranking");
  assert.deepEqual(chart.data, [{ label: "Netflix", value: 15_00 }]);
});

test("saldo con proyección: la línea proyectada arranca en el último saldo real y no se repite lo ya pasado", () => {
  const withProjection: StatsData = {
    ...data,
    projection: { projection: { series: [{ date: "2026-09-30", balanceCents: 1200_00 }, { date: "2026-10-01", balanceCents: 1100_00 }], endBalanceCents: 1100_00, events: [] }, minimumCents: 500_00, days: 60 } as unknown as StatsData["projection"],
  };
  const chart = buildStatsChart(params({ metric: "balance", group: "time", projection: true }), withProjection);
  assert.deepEqual(chart.data.map((row) => [row.actual ?? null, row.projected ?? null]), [[1000_00, null], [1200_00, 1200_00], [null, 1100_00]]);
  assert.equal(chart.references[0].value, 500_00);
  assert.equal(chart.series[1].dashed, true);
});

test("una gráfica sin valores se considera vacía", () => {
  const empty = buildStatsChart(params({ metric: "income", group: "time" }), { ...data, explorer: { ...explorer, series: [{ key: "2026-08-01", incomeCents: 0, expenseCents: 0 }], previousSeries: [] } });
  assert.equal(isEmptyChart(empty), true);
  assert.equal(isEmptyChart(buildStatsChart(params({ group: "time" }), data)), false);
});

test("las métricas de gasto incluyen comparación, ahorro y promedio", () => {
  const metrics = buildStatsMetrics(params({}), data, stats);
  assert.deepEqual(metrics.map((metric) => metric.key), ["expense", "income", "net", "average"]);
  assert.equal(metrics[0].tone, "danger");
  assert.equal(metrics[2].tone, "success");
});

test("la tabla por categoría ordena por total y toma la variación de las causas del cambio", () => {
  const table = buildStatsTable(params({ group: "category" }), data);
  assert.deepEqual(table?.rows.map((row) => row.label), ["Casa", "Otras"]);
  assert.equal(table?.rows[0].cells[2], "+$60");
  assert.equal(table?.rows[1].cells[2], "—");
});

test("la tabla por comercio añade el gasto sin comercio identificado", () => {
  const table = buildStatsTable(params({ group: "merchant" }), data);
  assert.equal(table?.rows.at(-1)?.label, "Sin comercio identificado");
});

test("la búsqueda ignora mayúsculas y acentos de captura", () => {
  const rows = buildStatsTable(params({ group: "category" }), data)?.rows ?? [];
  assert.deepEqual(filterStatsRows(rows, "  CAS ").map((row) => row.label), ["Casa"]);
  assert.equal(filterStatsRows(rows, "").length, 2);
});

import { buildLegend } from "./stats";

test("la leyenda de barras apiladas lleva el total de cada serie y la de líneas no", () => {
  const stacked = buildLegend(buildStatsChart(params({ group: "category" }), data));
  assert.deepEqual(stacked.map((item) => [item.label, item.value]), [["Casa", "$120"], ["Otras", "$30"]]);
  const lines = buildLegend(buildStatsChart(params({ metric: "balance", group: "time" }), data));
  assert.equal(lines[0].value, null);
  assert.deepEqual(buildLegend(buildStatsChart(params({ group: "merchant" }), data)), []);
});
