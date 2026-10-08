import type { StatsData } from "@/application/getStats";
import type { CategoryStats } from "@/domain/categoryStats/rules";
import { STACK_OTHERS_KEY, UNIDENTIFIED_MERCHANT_LABEL, type ExplorerBucket, type ExplorerPoint, type ExplorerShare } from "@/domain/explorer/rules";
import type { StatsMetric, StatsParams } from "@/domain/stats/params";
import { formatPercent, formatPesos, formatShortDate, formatMonthYearShort, formatSignedPercent, formatSignedPesos, formatDateRange } from "@/lib/format";
import { CATEGORY_COLORS, CHART_COLOR_VARS, OTHERS_COLOR } from "./charts";

export const STATS_METRIC_LABELS: Record<StatsMetric, string> = { expense: "Gasto", income: "Ingreso", net: "Neto", balance: "Saldo" };
export const STATS_GROUP_LABELS = { time: "Tiempo", category: "Categoría", merchant: "Comercio", account: "Cuenta" } as const;

const METRIC_COLOR: Record<StatsMetric, string> = { expense: "var(--chart-1)", income: "var(--success)", net: "var(--primary)", balance: "var(--chart-1)" };
const PREVIOUS_COLOR = "var(--muted-foreground)";

export type ChartKind = "bars" | "lines" | "ranking";
export type ChartPoint = Record<string, string | number | null>;

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
  stacked?: boolean;
  faded?: boolean;
  categoryId?: number | null;
}

export interface StatsChartModel {
  kind: ChartKind;
  data: ChartPoint[];
  series: ChartSeries[];
  references: Array<{ label: string; value: number; tone?: "danger" | "muted" }>;
  marker: string | null;
}

export function bucketLabel(key: string, bucket: ExplorerBucket): string {
  if (bucket === "month") return formatMonthYearShort(key);
  return bucket === "week" ? `Sem. ${formatShortDate(key)}` : formatShortDate(key);
}

const metricValue = (metric: StatsMetric, point: ExplorerPoint): number => (metric === "income" ? point.incomeCents : metric === "net" ? point.incomeCents - point.expenseCents : point.expenseCents);

function timeBars(params: StatsParams, data: StatsData): StatsChartModel {
  const { explorer } = data;
  const series: ChartSeries[] = [{ key: "value", label: STATS_METRIC_LABELS[params.metric], color: METRIC_COLOR[params.metric] }];
  if (params.compare) series.push({ key: "previous", label: "Periodo anterior", color: PREVIOUS_COLOR, faded: true });
  const points = explorer.series.map((point, index) => {
    const previous = explorer.previousSeries[index];
    const row: ChartPoint = { label: bucketLabel(point.key, explorer.bucket), value: metricValue(params.metric, point) };
    if (params.compare) row.previous = previous ? metricValue(params.metric, previous) : null;
    return row;
  });
  return { kind: "bars", data: points, series, references: [], marker: null };
}

function categoryStack(data: StatsData): StatsChartModel {
  const { stacked, bucket } = data.explorer;
  const series: ChartSeries[] = stacked.keys.map((key, index) => ({
    key: key.key,
    label: key.label,
    color: key.key === STACK_OTHERS_KEY ? OTHERS_COLOR : CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    stacked: true,
    categoryId: key.categoryId,
  }));
  const points = stacked.points.map((point) => ({ ...point, label: bucketLabel(String(point.bucket), bucket) }));
  return { kind: "bars", data: points, series, references: [], marker: null };
}

function merchantRanking(data: StatsData): StatsChartModel {
  const rows = data.explorer.byMerchant.map((share) => ({ label: share.name, value: share.totalCents }));
  return { kind: "ranking", data: rows, series: [{ key: "value", label: "Gasto", color: METRIC_COLOR.expense }], references: [], marker: null };
}

function balanceLines(params: StatsParams, data: StatsData): StatsChartModel {
  const actual = data.explorer.balance;
  const rows = new Map<string, ChartPoint>();
  for (const point of actual) rows.set(point.date, { date: point.date, label: formatShortDate(point.date), actual: point.balanceCents });
  const lastActual = actual.at(-1);
  const series: ChartSeries[] = [{ key: "actual", label: "Saldo real", color: METRIC_COLOR.balance }];
  const references: StatsChartModel["references"] = [];

  if (params.projection && data.projection) {
    series.push({ key: "projected", label: "Saldo proyectado", color: METRIC_COLOR.balance, dashed: true });
    if (lastActual) rows.set(lastActual.date, { ...rows.get(lastActual.date), projected: lastActual.balanceCents });
    for (const point of data.projection.projection.series) {
      if (lastActual && point.date <= lastActual.date) continue;
      rows.set(point.date, { date: point.date, label: formatShortDate(point.date), projected: point.balanceCents });
    }
    references.push({ label: `Saldo mínimo ${formatPesos(data.projection.minimumCents)}`, value: data.projection.minimumCents });
  }
  const sorted = [...rows.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return { kind: "lines", data: sorted, series, references, marker: lastActual ? formatShortDate(lastActual.date) : null };
}

function accountLines(data: StatsData): StatsChartModel {
  const accounts = data.accounts;
  if (!accounts) return { kind: "lines", data: [], series: [], references: [], marker: null };
  const series = accounts.accounts.map((account, index) => ({ key: account.key, label: account.label, color: CHART_COLOR_VARS[index % CHART_COLOR_VARS.length] }));
  const points = accounts.points.map((point) => ({ ...point, label: formatShortDate(String(point.date)) }));
  return { kind: "lines", data: points, series, references: [], marker: null };
}

export function buildStatsChart(params: StatsParams, data: StatsData): StatsChartModel {
  if (params.metric === "balance") return params.group === "account" ? accountLines(data) : balanceLines(params, data);
  if (params.group === "category") return categoryStack(data);
  if (params.group === "merchant") return merchantRanking(data);
  return timeBars(params, data);
}

export function isEmptyChart(model: StatsChartModel): boolean {
  if (model.data.length === 0) return true;
  return model.data.every((row) => model.series.every((series) => !row[series.key]));
}

export interface MetricView {
  key: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "danger";
  tooltip?: string;
}

export function buildStatsMetrics(params: StatsParams, data: StatsData, categoryStats: CategoryStats): MetricView[] {
  const { explorer } = data;
  if (params.metric === "balance") {
    const balance = explorer.balance;
    const first = balance[0];
    const last = balance.at(-1);
    const change = first && last ? last.balanceCents - first.balanceCents : 0;
    const metrics: MetricView[] = [
      { key: "now", label: "Saldo", value: last ? formatPesos(last.balanceCents) : "—", hint: last ? `al ${formatShortDate(last.date)}` : undefined },
      { key: "change", label: "Cambio en el rango", value: formatSignedPesos(change), tone: change > 0 ? "success" : change < 0 ? "danger" : "default" },
    ];
    if (data.projection) {
      const { projection, days, minimumCents } = data.projection;
      metrics.push({ key: "projected", label: `Saldo en ${days} días`, value: formatPesos(projection.endBalanceCents), tone: projection.endBalanceCents < minimumCents ? "danger" : "default" });
      metrics.push({ key: "minimum", label: "Saldo mínimo", value: formatPesos(minimumCents), hint: "Tu piso de seguridad" });
    }
    return metrics;
  }

  const net = explorer.incomeCents - explorer.expenseCents;
  const { comparison } = explorer;
  const pct = comparison.deltaExpensePct;
  return [
    {
      key: "expense",
      label: "Gasto",
      value: formatPesos(explorer.expenseCents),
      hint: pct != null ? `${formatSignedPercent(pct)} vs ${formatDateRange(comparison.from, comparison.to)}` : "Sin datos en el periodo anterior para comparar",
      tone: comparison.deltaExpenseCents > 0 ? "danger" : comparison.deltaExpenseCents < 0 ? "success" : "default",
    },
    { key: "income", label: "Ingresos", value: formatPesos(explorer.incomeCents), tone: "default" },
    { key: "net", label: "Ingresos − gastos", value: formatSignedPesos(net), hint: explorer.incomeCents > 0 ? `${formatPercent(net / explorer.incomeCents)} de tus ingresos` : undefined, tooltip: "Lo que sobró entre ingresos y gastos en este rango. No descuenta pagos de deuda ni lo que traspasaste a ahorro.", tone: net >= 0 ? "success" : "danger" },
    { key: "average", label: "Promedio mensual", value: formatPesos(categoryStats.totals.avgLast3Cents), hint: "Últimos 3 meses completos", tooltip: "Promedio de tus últimos meses completos, sin contar el mes en curso." },
  ];
}

export interface StatsTableRow {
  key: string;
  label: string;
  color?: string | null;
  spark?: number[];
  value: number;
  cells: string[];
  tones?: Array<"default" | "success" | "danger" | undefined>;
  categoryId?: number | null;
  merchant?: string;
}

export interface StatsTableModel {
  columns: string[];
  rows: StatsTableRow[];
  total?: StatsTableRow;
}

const signedTone = (cents: number) => (cents > 0 ? "danger" : cents < 0 ? "success" : "default");

function categoryTable(data: StatsData): StatsTableModel {
  const { explorer } = data;
  const deltas = new Map(explorer.comparison.drivers.map((driver) => [driver.categoryId, driver.deltaCents]));
  const rows = explorer.stacked.keys
    .map((key, index): StatsTableRow => {
      const values = explorer.stacked.points.map((point) => Number(point[key.key] ?? 0));
      const total = values.reduce((sum, value) => sum + value, 0);
      const share = explorer.expenseCents > 0 ? total / explorer.expenseCents : 0;
      const delta = key.categoryId != null ? deltas.get(key.categoryId) : undefined;
      return {
        key: key.key,
        label: key.label,
        color: key.key === STACK_OTHERS_KEY ? OTHERS_COLOR : CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        spark: values,
        value: total,
        cells: [formatPesos(total), formatPercent(share), delta != null ? formatSignedPesos(delta) : "—"],
        tones: [undefined, undefined, delta != null ? signedTone(delta) : undefined],
        categoryId: key.categoryId,
      };
    })
    .sort((a, b) => b.value - a.value);
  return { columns: ["Tendencia", "Total", "% del gasto", "vs periodo anterior"], rows, total: { key: "total", label: "Total", value: explorer.expenseCents, cells: [formatPesos(explorer.expenseCents), "100%", formatSignedPesos(explorer.comparison.deltaExpenseCents)], tones: [undefined, undefined, signedTone(explorer.comparison.deltaExpenseCents)] } };
}

function merchantRow(share: ExplorerShare): StatsTableRow {
  return { key: share.key, label: share.name, value: share.totalCents, cells: [formatPesos(share.totalCents), formatPercent(share.share), share.count === 1 ? "1 mov." : `${share.count} mov.`], merchant: share.name };
}

function merchantTable(data: StatsData): StatsTableModel {
  const { explorer } = data;
  const rows = explorer.byMerchant.map(merchantRow);
  if (explorer.unidentified) {
    rows.push({ key: "unidentified", label: UNIDENTIFIED_MERCHANT_LABEL, value: explorer.unidentified.totalCents, cells: [formatPesos(explorer.unidentified.totalCents), formatPercent(explorer.unidentified.share), `${explorer.unidentified.count} mov.`], merchant: UNIDENTIFIED_MERCHANT_LABEL });
  }
  return { columns: ["Gasto", "% del gasto", "Movimientos"], rows };
}

function timeTable(data: StatsData): StatsTableModel {
  const { explorer } = data;
  const rows = explorer.series.map((point): StatsTableRow => ({
    key: point.key,
    label: bucketLabel(point.key, explorer.bucket),
    value: point.expenseCents,
    cells: [formatPesos(point.incomeCents), formatPesos(point.expenseCents), formatSignedPesos(point.incomeCents - point.expenseCents)],
    tones: [undefined, undefined, point.incomeCents - point.expenseCents < 0 ? "danger" : "success"],
  }));
  return { columns: ["Ingresos", "Gastos", "Neto"], rows: rows.reverse() };
}

function accountsTable(data: StatsData): StatsTableModel {
  const accounts = data.accounts;
  if (!accounts) return { columns: [], rows: [] };
  const rows = accounts.accounts.map((account): StatsTableRow => {
    const values = accounts.points.map((point) => point[account.key]).filter((value): value is number => typeof value === "number");
    const last = values.at(-1) ?? 0;
    const change = last - (values[0] ?? 0);
    return { key: account.key, label: account.label, spark: values, value: last, cells: [formatPesos(last), formatSignedPesos(change)], tones: [undefined, change > 0 ? "success" : change < 0 ? "danger" : "default"] };
  });
  return { columns: ["Tendencia", "Saldo", "Cambio"], rows };
}

export function buildStatsTable(params: StatsParams, data: StatsData): StatsTableModel | null {
  if (params.metric === "balance") return params.group === "account" ? accountsTable(data) : null;
  if (params.group === "category") return categoryTable(data);
  if (params.group === "merchant") return merchantTable(data);
  return timeTable(data);
}

export function sortStatsRows(rows: StatsTableRow[], sort: "value" | "label"): StatsTableRow[] {
  return [...rows].sort((a, b) => (sort === "label" ? a.label.localeCompare(b.label, "es") : b.value - a.value));
}

export function filterStatsRows(rows: StatsTableRow[], query: string): StatsTableRow[] {
  const needle = query.trim().toLocaleLowerCase("es");
  return needle ? rows.filter((row) => row.label.toLocaleLowerCase("es").includes(needle)) : rows;
}

export interface LegendItem {
  key: string;
  label: string;
  color: string;
  value: string | null;
  categoryId: number | null;
  dashed: boolean;
}

export function buildLegend(model: StatsChartModel): LegendItem[] {
  if (model.kind === "ranking") return [];
  return model.series.map((series) => {
    const numbers = model.data.map((row) => row[series.key]).filter((value): value is number => typeof value === "number");
    const total = numbers.reduce((sum, value) => sum + value, 0);
    return { key: series.key, label: series.label, color: series.color, value: series.stacked ? formatPesos(total) : null, categoryId: series.categoryId ?? null, dashed: Boolean(series.dashed) };
  });
}
