import { SPENDING_NATURES, SPENDING_NATURE_LABELS, effectiveNature, type NatureCategory, type SpendingNature } from "@/domain/categories/nature";
import { shiftMonth } from "@/domain/dashboard/rules";
import { monthStart } from "@/domain/ledger/rules";
import { groupBy } from "@/domain/shared/collections";

export const UNCATEGORIZED_ID = 0;
export const UNKNOWN_CATEGORY_ID = -1;

export const DEFAULT_STAT_MONTHS = 6;
const AVERAGE_WINDOW_MONTHS = 3;

export interface StatCategory {
  id: number;
  name: string;
  parentId: number | null;
  nature?: SpendingNature | null;
}

export interface MonthlyCategorySpend {
  categoryId: number | null;
  month: string;
  spentCents: number;
  count: number;
}

export interface CategoryStatRow {
  categoryId: number;
  name: string;
  depth: 0 | 1;
  parentId: number | null;
  seriesCents: number[];
  count: number;
  windowCents: number;
  avgLast3Cents: number;
  lastMonthCents: number;
  previousMonthCents: number;
  deltaCents: number;
  deltaPct: number | null;
  shareOfWindow: number;
  discretionaryShare: number;
}

export interface CategoryStatTotals {
  seriesCents: number[];
  windowCents: number;
  avgLast3Cents: number;
  lastMonthCents: number;
  previousMonthCents: number;
  deltaCents: number;
  deltaPct: number | null;
}

export interface NatureStatRow {
  nature: SpendingNature | null;
  label: string;
  seriesCents: number[];
  windowCents: number;
  avgLast3Cents: number;
  shareOfWindow: number;
}

export interface CategoryStats {
  months: string[];
  currentMonth: string;
  completedMonths: string[];
  rows: CategoryStatRow[];
  totals: CategoryStatTotals;
  natures: NatureStatRow[];
}

export function statMonths(today: string, count = DEFAULT_STAT_MONTHS): string[] {
  const current = monthStart(today);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) months.push(shiftMonth(current, -i));
  return months;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function deltaOf(last: number, previous: number): { deltaCents: number; deltaPct: number | null } {
  return { deltaCents: last - previous, deltaPct: previous > 0 ? (last - previous) / previous : null };
}

interface Aggregate {
  series: number[];
  count: number;
}

export function buildCategoryStats(input: { categories: StatCategory[]; spend: MonthlyCategorySpend[]; today: string; monthsCount?: number }): CategoryStats {
  const months = statMonths(input.today, input.monthsCount ?? DEFAULT_STAT_MONTHS);
  const monthIndex = new Map(months.map((m, i) => [m, i]));
  const currentMonth = months[months.length - 1];

  const known = new Map(input.categories.map((c) => [c.id, c]));
  const effectiveId = (categoryId: number | null) => (categoryId == null ? UNCATEGORIZED_ID : known.has(categoryId) ? categoryId : UNKNOWN_CATEGORY_ID);

  const own = new Map<number, Aggregate>();
  for (const s of input.spend) {
    const index = monthIndex.get(s.month);
    if (index === undefined) continue;
    const id = effectiveId(s.categoryId);
    const agg = own.get(id) ?? { series: months.map(() => 0), count: 0 };
    agg.series[index] += s.spentCents;
    if (s.month !== currentMonth) agg.count += s.count;
    own.set(id, agg);
  }

  const firstDataIndex = Math.min(...[...own.values()].flatMap((a) => a.series.map((v, i) => (v !== 0 ? i : Infinity))), Infinity);
  const completedIndexes = months.map((_, i) => i).filter((i) => i < months.length - 1 && i >= firstDataIndex);
  const lastIndex = completedIndexes[completedIndexes.length - 1];
  const previousIndex = completedIndexes[completedIndexes.length - 2];
  const averageIndexes = completedIndexes.slice(-AVERAGE_WINDOW_MONTHS);

  const isChild = (c: StatCategory) => c.parentId != null && c.parentId !== c.id && known.has(c.parentId);
  const childrenOf = groupBy(input.categories.filter(isChild), (c) => c.parentId as number);

  const metrics = (series: number[], count: number) => {
    const lastMonthCents = lastIndex === undefined ? 0 : series[lastIndex];
    const previousMonthCents = previousIndex === undefined ? 0 : series[previousIndex];
    return {
      count,
      windowCents: sum(completedIndexes.map((i) => series[i])),
      avgLast3Cents: averageIndexes.length > 0 ? Math.round(sum(averageIndexes.map((i) => series[i])) / averageIndexes.length) : 0,
      lastMonthCents,
      previousMonthCents,
      ...deltaOf(lastMonthCents, previousMonthCents),
    };
  };

  type Draft = Omit<CategoryStatRow, "shareOfWindow" | "discretionaryShare">;
  const draftOf = (id: number, name: string, depth: 0 | 1, parentId: number | null, series: number[], count: number): Draft => ({
    categoryId: id,
    name,
    depth,
    parentId,
    seriesCents: series,
    ...metrics(series, count),
  });
  const hasAnySpend = (d: Draft) => d.seriesCents.some((v) => v !== 0);

  const groups: Array<{ root: Draft; children: Draft[] }> = [];
  for (const c of input.categories.filter((x) => !isChild(x))) {
    const children = (childrenOf.get(c.id) ?? [])
      .map((child) => {
        const agg = own.get(child.id);
        return draftOf(child.id, child.name, 1, c.id, agg?.series ?? months.map(() => 0), agg?.count ?? 0);
      })
      .filter(hasAnySpend);
    const ownAgg = own.get(c.id);
    const series = months.map((_, i) => (ownAgg?.series[i] ?? 0) + sum(children.map((ch) => ch.seriesCents[i])));
    const count = (ownAgg?.count ?? 0) + sum(children.map((ch) => ch.count));
    const root = draftOf(c.id, c.name, 0, null, series, count);
    if (hasAnySpend(root)) groups.push({ root, children });
  }
  for (const [id, name] of [[UNCATEGORIZED_ID, "Sin categoría"], [UNKNOWN_CATEGORY_ID, "Otro"]] as const) {
    const agg = own.get(id);
    if (!agg) continue;
    const root = draftOf(id, name, 0, null, agg.series, agg.count);
    if (hasAnySpend(root)) groups.push({ root, children: [] });
  }

  const byWindow = (a: Draft, b: Draft) => b.windowCents - a.windowCents || sum(b.seriesCents) - sum(a.seriesCents);
  groups.sort((a, b) => byWindow(a.root, b.root));
  for (const g of groups) g.children.sort(byWindow);

  const totalSeries = months.map((_, i) => sum(groups.map((g) => g.root.seriesCents[i])));
  const totals = { seriesCents: totalSeries, ...metrics(totalSeries, sum(groups.map((g) => g.root.count))) };
  const share = (d: Draft) => (totals.windowCents > 0 ? d.windowCents / totals.windowCents : 0);

  const natureById = new Map<number, NatureCategory>(input.categories.map((c) => [c.id, { id: c.id, parentId: c.parentId, nature: c.nature ?? null }]));
  const natureSeries = new Map<SpendingNature | null, number[]>();
  for (const [id, agg] of own) {
    const category = natureById.get(id);
    const nature = category ? effectiveNature(category, natureById) : null;
    const series = natureSeries.get(nature) ?? months.map(() => 0);
    agg.series.forEach((v, i) => (series[i] += v));
    natureSeries.set(nature, series);
  }
  const rootOf = (id: number) => {
    const c = natureById.get(id);
    return c?.parentId != null && natureById.has(c.parentId) ? c.parentId : id;
  };
  const windowTotal = new Map<number, number>();
  const windowDiscretionary = new Map<number, number>();
  for (const [id, agg] of own) {
    const category = natureById.get(id);
    const root = category ? rootOf(id) : id;
    const windowCents = sum(completedIndexes.map((i) => agg.series[i]));
    windowTotal.set(root, (windowTotal.get(root) ?? 0) + windowCents);
    if (category && effectiveNature(category, natureById) === "discretionary") windowDiscretionary.set(root, (windowDiscretionary.get(root) ?? 0) + windowCents);
    if (category && category.parentId != null && natureById.has(category.parentId)) {
      windowTotal.set(id, windowCents);
      if (effectiveNature(category, natureById) === "discretionary") windowDiscretionary.set(id, windowCents);
    }
  }
  const discretionaryShareOf = (d: Pick<Draft, "categoryId">) => {
    const total = windowTotal.get(d.categoryId) ?? 0;
    return total > 0 ? (windowDiscretionary.get(d.categoryId) ?? 0) / total : 0;
  };

  const natureRows: NatureStatRow[] = ([...SPENDING_NATURES, null] as Array<SpendingNature | null>)
    .map((nature) => {
      const series = natureSeries.get(nature) ?? months.map(() => 0);
      const m = metrics(series, 0);
      return {
        nature,
        label: nature ? SPENDING_NATURE_LABELS[nature] : "Sin clasificar",
        seriesCents: series,
        windowCents: m.windowCents,
        avgLast3Cents: m.avgLast3Cents,
        shareOfWindow: totals.windowCents > 0 ? m.windowCents / totals.windowCents : 0,
      };
    })
    .filter((r) => r.seriesCents.some((v) => v !== 0));

  return {
    months,
    currentMonth,
    completedMonths: completedIndexes.map((i) => months[i]),
    rows: groups.flatMap((g) => [g.root, ...g.children]).map((d) => ({ ...d, shareOfWindow: share(d), discretionaryShare: discretionaryShareOf(d) })),
    natures: natureRows,
    totals: {
      seriesCents: totals.seriesCents,
      windowCents: totals.windowCents,
      avgLast3Cents: totals.avgLast3Cents,
      lastMonthCents: totals.lastMonthCents,
      previousMonthCents: totals.previousMonthCents,
      deltaCents: totals.deltaCents,
      deltaPct: totals.deltaPct,
    },
  };
}
