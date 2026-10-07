import type { SpendingNature } from "@/domain/categories/nature";
import { addDays } from "@/domain/payPeriod/rules";

export const MAX_EXPLORER_DAYS = 400;
export const DAY_BUCKET_MAX_DAYS = 31;
export const WEEK_BUCKET_MAX_DAYS = 150;
export const TOP_CATEGORIES = 8;
export const TOP_MERCHANTS = 10;
export const MERCHANT_OPTIONS_LIMIT = 40;
export const TOP_DRIVERS = 5;
export const UNCATEGORIZED_LABEL = "Sin categoría";
export const UNIDENTIFIED_MERCHANT_LABEL = "Sin comercio identificado";

export class InvalidExplorerFiltersError extends Error {}

export type ExplorerBucket = "day" | "week" | "month";

export interface ExplorerFilters {
  from: string;
  to: string;
  accountId: number | null;
  categoryId: number | null;
  merchant: string | null;
  nature: SpendingNature | null;
}

export interface ExplorerCategory {
  id: number;
  parentId: number | null;
  name: string;
  color: string;
  spendingNature: SpendingNature | null;
}

export interface ExplorerRow {
  bucket: string;
  categoryId: number | null;
  merchant: string | null;
  incomeCents: number;
  expenseCents: number;
  count: number;
}

export interface ExplorerPoint {
  key: string;
  incomeCents: number;
  expenseCents: number;
}

export interface ExplorerShare {
  key: string;
  categoryId: number | null;
  name: string;
  color: string | null;
  totalCents: number;
  count: number;
  share: number;
}

export interface ExplorerDriver {
  name: string;
  categoryId: number | null;
  deltaCents: number;
}

export interface ExplorerComparison {
  from: string;
  to: string;
  expenseCents: number;
  incomeCents: number;
  deltaExpenseCents: number;
  deltaExpensePct: number | null;
  drivers: ExplorerDriver[];
}

export interface ExplorerResult {
  from: string;
  to: string;
  bucket: ExplorerBucket;
  incomeCents: number;
  expenseCents: number;
  count: number;
  series: ExplorerPoint[];
  byCategory: ExplorerShare[];
  drillParent: { id: number; name: string } | null;
  byMerchant: ExplorerShare[];
  unidentified: { totalCents: number; count: number; share: number } | null;
  merchantOptions: string[];
  comparison: ExplorerComparison;
  balance: Array<{ date: string; balanceCents: number }>;
}

const MS_PER_DAY = 86_400_000;
const daysBetweenInclusive = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY) + 1;

export function assertValidExplorerRange(from: string, to: string): void {
  const days = daysBetweenInclusive(from, to);
  if (Number.isNaN(days) || days < 1) throw new InvalidExplorerFiltersError("El rango de fechas es inválido.");
  if (days > MAX_EXPLORER_DAYS) throw new InvalidExplorerFiltersError(`El rango no puede pasar de ${MAX_EXPLORER_DAYS} días.`);
}

export function bucketFor(from: string, to: string): ExplorerBucket {
  const days = daysBetweenInclusive(from, to);
  if (days <= DAY_BUCKET_MAX_DAYS) return "day";
  return days <= WEEK_BUCKET_MAX_DAYS ? "week" : "month";
}

export function bucketStart(date: string, bucket: ExplorerBucket): string {
  if (bucket === "day") return date;
  if (bucket === "month") return `${date.slice(0, 7)}-01`;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

export function bucketKeys(from: string, to: string, bucket: ExplorerBucket): string[] {
  const keys: string[] = [];
  for (let key = bucketStart(from, bucket); key <= to; ) {
    keys.push(key);
    key = bucket === "month" ? nextMonth(key) : addDays(key, bucket === "week" ? 7 : 1);
  }
  return keys;
}

function nextMonth(monthStartIso: string): string {
  const year = Number(monthStartIso.slice(0, 4));
  const month = Number(monthStartIso.slice(5, 7));
  return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

export function previousRange(from: string, to: string): { from: string; to: string } {
  const days = daysBetweenInclusive(from, to);
  const previousTo = addDays(from, -1);
  return { from: addDays(previousTo, -(days - 1)), to: previousTo };
}

interface Indexes {
  byId: Map<number, ExplorerCategory>;
  rootOf: (id: number | null) => ExplorerCategory | null;
  childrenOf: (id: number) => ExplorerCategory[];
}

function indexCategories(categories: ExplorerCategory[]): Indexes {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const rootOf = (id: number | null) => {
    if (id == null) return null;
    const category = byId.get(id);
    if (!category) return null;
    return category.parentId != null && byId.has(category.parentId) ? (byId.get(category.parentId) as ExplorerCategory) : category;
  };
  return { byId, rootOf, childrenOf: (id) => categories.filter((c) => c.parentId === id) };
}

export function filterRows(rows: ExplorerRow[], filters: Pick<ExplorerFilters, "categoryId" | "nature" | "merchant">, categories: ExplorerCategory[], options: { applyMerchant: boolean } = { applyMerchant: true }): ExplorerRow[] {
  const { byId, childrenOf } = indexCategories(categories);
  const allowed = filters.categoryId != null ? new Set([filters.categoryId, ...childrenOf(filters.categoryId).map((c) => c.id)]) : null;
  return rows
    .filter((row) => (allowed ? row.categoryId != null && allowed.has(row.categoryId) : true))
    .filter((row) => (filters.nature ? row.categoryId != null && byId.get(row.categoryId)?.spendingNature === filters.nature : true))
    .filter((row) => (options.applyMerchant && filters.merchant ? (row.merchant ?? UNIDENTIFIED_MERCHANT_LABEL) === filters.merchant : true))
    .map((row) => (filters.nature ? { ...row, incomeCents: 0 } : row))
    .filter((row) => row.incomeCents !== 0 || row.expenseCents !== 0 || row.count > 0);
}

function sumExpense(rows: ExplorerRow[]) {
  return rows.reduce((sum, row) => sum + row.expenseCents, 0);
}

export function sharesByCategory(rows: ExplorerRow[], categories: ExplorerCategory[], parentId: number | null): ExplorerShare[] {
  const { byId, rootOf } = indexCategories(categories);
  const groups = new Map<string, { categoryId: number | null; name: string; color: string | null; totalCents: number; count: number }>();
  for (const row of rows) {
    if (row.expenseCents <= 0) continue;
    const category = row.categoryId == null ? null : (byId.get(row.categoryId) ?? null);
    const target = parentId != null ? category : rootOf(row.categoryId);
    const key = target ? String(target.id) : "none";
    const group = groups.get(key) ?? { categoryId: target?.id ?? null, name: target?.name ?? UNCATEGORIZED_LABEL, color: target?.color ?? null, totalCents: 0, count: 0 };
    group.totalCents += row.expenseCents;
    group.count += row.count;
    groups.set(key, group);
  }
  const total = sumExpense(rows);
  const sorted = [...groups.entries()].map(([key, g]) => ({ key, ...g, share: total > 0 ? g.totalCents / total : 0 })).sort((a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name, "es"));
  if (sorted.length <= TOP_CATEGORIES) return sorted;
  const rest = sorted.slice(TOP_CATEGORIES);
  const restTotal = rest.reduce((sum, g) => sum + g.totalCents, 0);
  return [...sorted.slice(0, TOP_CATEGORIES), { key: "others", categoryId: null, name: "Otras", color: null, totalCents: restTotal, count: rest.reduce((sum, g) => sum + g.count, 0), share: total > 0 ? restTotal / total : 0 }];
}

export function sharesByMerchant(rows: ExplorerRow[]): { ranked: ExplorerShare[]; unidentified: { totalCents: number; count: number; share: number } | null } {
  const total = sumExpense(rows);
  const named = new Map<string, { totalCents: number; count: number }>();
  let unidentified = { totalCents: 0, count: 0 };
  for (const row of rows) {
    if (row.expenseCents <= 0) continue;
    if (row.merchant == null) {
      unidentified = { totalCents: unidentified.totalCents + row.expenseCents, count: unidentified.count + row.count };
      continue;
    }
    const current = named.get(row.merchant) ?? { totalCents: 0, count: 0 };
    named.set(row.merchant, { totalCents: current.totalCents + row.expenseCents, count: current.count + row.count });
  }
  const ranked = [...named.entries()]
    .map(([merchant, v]) => ({ key: merchant, categoryId: null, name: merchant, color: null, ...v, share: total > 0 ? v.totalCents / total : 0 }))
    .sort((a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name, "es"))
    .slice(0, TOP_MERCHANTS);
  return { ranked, unidentified: unidentified.count > 0 ? { ...unidentified, share: total > 0 ? unidentified.totalCents / total : 0 } : null };
}

export function composeSeries(rows: ExplorerRow[], from: string, to: string, bucket: ExplorerBucket): ExplorerPoint[] {
  const points = new Map(bucketKeys(from, to, bucket).map((key) => [key, { key, incomeCents: 0, expenseCents: 0 }]));
  for (const row of rows) {
    const point = points.get(bucketStart(row.bucket, bucket));
    if (!point) continue;
    point.incomeCents += row.incomeCents;
    point.expenseCents += row.expenseCents;
  }
  return [...points.values()];
}

export function composeComparison(current: ExplorerRow[], previous: ExplorerRow[], previousWindow: { from: string; to: string }, categories: ExplorerCategory[]): ExplorerComparison {
  const expenseCents = sumExpense(current);
  const previousExpense = sumExpense(previous);
  const totalsByRoot = (rows: ExplorerRow[]) => new Map(sharesByCategory(rows, categories, null).map((s) => [s.key, s]));
  const now = totalsByRoot(current);
  const before = totalsByRoot(previous);
  const drivers = [...new Set([...now.keys(), ...before.keys()])]
    .filter((key) => key !== "others")
    .map((key) => ({ name: (now.get(key) ?? before.get(key))?.name ?? UNCATEGORIZED_LABEL, categoryId: (now.get(key) ?? before.get(key))?.categoryId ?? null, deltaCents: (now.get(key)?.totalCents ?? 0) - (before.get(key)?.totalCents ?? 0) }))
    .filter((driver) => driver.deltaCents !== 0)
    .sort((a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents))
    .slice(0, TOP_DRIVERS);
  return {
    from: previousWindow.from,
    to: previousWindow.to,
    expenseCents: previousExpense,
    incomeCents: previous.reduce((sum, row) => sum + row.incomeCents, 0),
    deltaExpenseCents: expenseCents - previousExpense,
    deltaExpensePct: previousExpense > 0 ? (expenseCents - previousExpense) / previousExpense : null,
    drivers,
  };
}

export interface ComposeExplorerInput {
  filters: ExplorerFilters;
  bucket: ExplorerBucket;
  currentRows: ExplorerRow[];
  previousRows: ExplorerRow[];
  categories: ExplorerCategory[];
  balance: Array<{ date: string; balanceCents: number }>;
}

export function composeExplorer({ filters, bucket, currentRows, previousRows, categories, balance }: ComposeExplorerInput): ExplorerResult {
  const { byId, childrenOf } = indexCategories(categories);
  const previousWindow = previousRange(filters.from, filters.to);
  const withoutMerchant = filterRows(currentRows, filters, categories, { applyMerchant: false });
  const current = filterRows(currentRows, filters, categories);
  const previous = filterRows(previousRows, filters, categories);

  const selected = filters.categoryId != null ? byId.get(filters.categoryId) : undefined;
  const drillParent = selected && selected.parentId == null && childrenOf(selected.id).length > 0 ? { id: selected.id, name: selected.name } : null;
  const merchants = sharesByMerchant(current);

  const merchantTotals = new Map<string, number>();
  for (const row of withoutMerchant) if (row.expenseCents > 0 && row.merchant != null) merchantTotals.set(row.merchant, (merchantTotals.get(row.merchant) ?? 0) + row.expenseCents);

  return {
    from: filters.from,
    to: filters.to,
    bucket,
    incomeCents: current.reduce((sum, row) => sum + row.incomeCents, 0),
    expenseCents: sumExpense(current),
    count: current.reduce((sum, row) => sum + row.count, 0),
    series: composeSeries(current, filters.from, filters.to, bucket),
    byCategory: sharesByCategory(current, categories, drillParent?.id ?? null),
    drillParent,
    byMerchant: merchants.ranked,
    unidentified: merchants.unidentified,
    merchantOptions: [...merchantTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MERCHANT_OPTIONS_LIMIT).map(([name]) => name),
    comparison: composeComparison(current, previous, previousWindow, categories),
    balance,
  };
}
