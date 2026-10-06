import { UNCATEGORIZED_ID, type CategoryStats } from "@/domain/categoryStats/rules";
import { endOfMonth } from "@/domain/cashflow/rules";
import { FAST_GROWTH_MIN_CENTS, FAST_GROWTH_PCT, Insight, MIN_CATEGORY_CHANGE_CENTS, MIN_CATEGORY_CHANGE_PCT, MIN_STREAK_MONTHS } from "./model";
import { drilldown, monthName, pct, pesos } from "./format";

function completedSeries(stats: CategoryStats, series: number[]): number[] {
  return stats.completedMonths.map((m) => series[stats.months.indexOf(m)] ?? 0);
}

const rootRows = (stats: CategoryStats) => stats.rows.filter((r) => r.depth === 0 && r.categoryId > UNCATEGORIZED_ID);

export function categoryChangeInsights(stats: CategoryStats): Insight[] {
  if (stats.completedMonths.length < 3) return [];
  const lastMonth = stats.completedMonths[stats.completedMonths.length - 1];
  const insights: Insight[] = [];

  for (const row of rootRows(stats)) {
    const values = completedSeries(stats, row.seriesCents);
    const last = values[values.length - 1];
    const before = values.slice(Math.max(0, values.length - 4), values.length - 1);
    const baseline = before.reduce((a, b) => a + b, 0) / before.length;
    if (baseline <= 0) continue;
    const delta = last - baseline;
    if (Math.abs(delta) < MIN_CATEGORY_CHANGE_CENTS || Math.abs(delta / baseline) < MIN_CATEGORY_CHANGE_PCT) continue;

    const up = delta > 0;
    insights.push({
      id: `category-change-${row.categoryId}`,
      tone: up ? "change" : "positive",
      message: `${row.name} ${up ? "subió" : "bajó"} ${pesos(delta)} en ${monthName(lastMonth)} (${up ? "+" : "−"}${pct(delta / baseline)})`,
      detail: `${pesos(last)} frente a un promedio de ${pesos(baseline)} en los ${before.length} meses anteriores.`,
      href: drilldown(row.categoryId, lastMonth, endOfMonth(lastMonth)),
      weight: Math.abs(delta),
    });
  }
  return insights.sort((a, b) => b.weight - a.weight);
}

function risingStreak(values: number[]): number {
  let streak = 0;
  for (let i = values.length - 1; i > 0 && values[i] > values[i - 1] && values[i - 1] > 0; i--) streak++;
  return streak;
}

export function categoryStreakInsights(stats: CategoryStats): Insight[] {
  const insights: Insight[] = [];
  for (const row of rootRows(stats)) {
    const values = completedSeries(stats, row.seriesCents);
    const streak = risingStreak(values);
    if (streak < MIN_STREAK_MONTHS) continue;
    const from = values[values.length - 1 - streak];
    const to = values[values.length - 1];
    insights.push({
      id: `category-streak-${row.categoryId}`,
      tone: "attention",
      message: `${row.name} lleva ${streak} meses consecutivos aumentando`,
      detail: `De ${pesos(from)} a ${pesos(to)} al mes.`,
      href: drilldown(row.categoryId, stats.completedMonths[stats.completedMonths.length - 1 - streak], endOfMonth(stats.completedMonths[stats.completedMonths.length - 1])),
      weight: to - from,
    });
  }
  return insights.sort((a, b) => b.weight - a.weight);
}

export function fastGrowthInsights(stats: CategoryStats, alreadyReported: Set<number> = new Set()): Insight[] {
  if (stats.completedMonths.length < 2) return [];
  const lastMonth = stats.completedMonths[stats.completedMonths.length - 1];
  const previousMonth = stats.completedMonths[stats.completedMonths.length - 2];
  const insights: Insight[] = [];

  for (const row of rootRows(stats)) {
    if (alreadyReported.has(row.categoryId)) continue;
    const values = completedSeries(stats, row.seriesCents);
    const last = values[values.length - 1];
    const previous = values[values.length - 2];
    if (previous <= 0) continue;
    const growth = (last - previous) / previous;
    if (growth < FAST_GROWTH_PCT || last - previous < FAST_GROWTH_MIN_CENTS) continue;
    insights.push({
      id: `category-fast-growth-${row.categoryId}`,
      tone: "attention",
      message: `${row.name} creció ${pct(growth)} de ${monthName(previousMonth)} a ${monthName(lastMonth)}`,
      detail: `Pasó de ${pesos(previous)} a ${pesos(last)} en un mes.`,
      href: drilldown(row.categoryId, lastMonth, endOfMonth(lastMonth)),
      weight: last - previous,
    });
  }
  return insights.sort((a, b) => b.weight - a.weight);
}
