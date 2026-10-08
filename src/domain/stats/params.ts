import { SPENDING_NATURES, type SpendingNature } from "@/domain/categories/nature";
import { EXPLORER_PRESETS, resolvePreset, type ExplorerPreset, type PresetRange } from "@/domain/explorer/presets";
import type { ExplorerFilters } from "@/domain/explorer/rules";
import type { EvolutionRangeKey } from "@/domain/evolution/rules";

export const STATS_METRICS = ["expense", "income", "net", "balance"] as const;
export const STATS_GROUPS = ["time", "category", "merchant", "account"] as const;
export type StatsMetric = (typeof STATS_METRICS)[number];
export type StatsGroup = (typeof STATS_GROUPS)[number];

export interface StatsParams {
  metric: StatsMetric;
  group: StatsGroup;
  preset: ExplorerPreset;
  from: string | null;
  to: string | null;
  compare: boolean;
  projection: boolean;
  accountId: number | null;
  categoryId: number | null;
  merchant: string | null;
  nature: SpendingNature | null;
}

export const DEFAULT_STATS_PARAMS: StatsParams = {
  metric: "expense",
  group: "category",
  preset: "6m",
  from: null,
  to: null,
  compare: false,
  projection: false,
  accountId: null,
  categoryId: null,
  merchant: null,
  nature: null,
};

export type RawStatsParams = Record<string, string | string[] | undefined>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const oneOf = <T extends string>(allowed: readonly T[], value: string | undefined, fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
const positiveId = (value: string | undefined) => (value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null);

export function normalizeStatsParams(params: StatsParams): StatsParams {
  const next = { ...params };
  if (next.group === "account" && next.metric !== "balance") next.group = "time";
  if ((next.group === "category" || next.group === "merchant") && next.metric !== "expense") next.group = "time";
  if (next.preset === "custom" && !(next.from && next.to && next.from <= next.to)) {
    next.preset = DEFAULT_STATS_PARAMS.preset;
  }
  if (next.preset !== "custom") {
    next.from = null;
    next.to = null;
  }
  next.projection = next.projection && next.metric === "balance" && next.group === "time" && next.accountId == null;
  next.compare = next.compare && next.group === "time" && next.metric !== "balance";
  if (next.group === "account") next.accountId = null;
  return next;
}

export function parseStatsParams(raw: RawStatsParams): StatsParams {
  const from = first(raw.from);
  const to = first(raw.to);
  const nature = first(raw.nat);
  const merchant = first(raw.mer)?.trim();
  return normalizeStatsParams({
    metric: oneOf(STATS_METRICS, first(raw.m), DEFAULT_STATS_PARAMS.metric),
    group: oneOf(STATS_GROUPS, first(raw.g), DEFAULT_STATS_PARAMS.group),
    preset: oneOf(EXPLORER_PRESETS, first(raw.r), DEFAULT_STATS_PARAMS.preset),
    from: from && ISO_DATE.test(from) ? from : null,
    to: to && ISO_DATE.test(to) ? to : null,
    compare: first(raw.cmp) === "1",
    projection: first(raw.proj) === "1",
    accountId: positiveId(first(raw.acc)),
    categoryId: positiveId(first(raw.cat)),
    merchant: merchant ? merchant.slice(0, 100) : null,
    nature: SPENDING_NATURES.includes(nature as SpendingNature) ? (nature as SpendingNature) : null,
  });
}

export function serializeStatsParams(params: StatsParams): string {
  const value = normalizeStatsParams(params);
  const defaults = DEFAULT_STATS_PARAMS;
  const search = new URLSearchParams();
  if (value.metric !== defaults.metric) search.set("m", value.metric);
  if (value.group !== defaults.group) search.set("g", value.group);
  if (value.preset !== defaults.preset) search.set("r", value.preset);
  if (value.preset === "custom" && value.from && value.to) {
    search.set("from", value.from);
    search.set("to", value.to);
  }
  if (value.compare) search.set("cmp", "1");
  if (value.projection) search.set("proj", "1");
  if (value.accountId != null) search.set("acc", String(value.accountId));
  if (value.categoryId != null) search.set("cat", String(value.categoryId));
  if (value.merchant) search.set("mer", value.merchant);
  if (value.nature) search.set("nat", value.nature);
  return search.toString();
}

export function statsRange(params: StatsParams, today: string, currentPeriod: PresetRange | null): PresetRange {
  const custom = params.from && params.to ? { from: params.from, to: params.to } : null;
  return resolvePreset(params.preset, today, currentPeriod, custom);
}

export function toStatsExplorerFilters(params: StatsParams, today: string, currentPeriod: PresetRange | null): ExplorerFilters {
  const { from, to } = statsRange(params, today, currentPeriod);
  return { from, to, accountId: params.accountId, categoryId: params.categoryId, merchant: params.merchant, nature: params.nature };
}

const EVOLUTION_BY_PRESET: Record<ExplorerPreset, EvolutionRangeKey> = { period: "30d", "30d": "30d", "3m": "3m", "6m": "6m", "12m": "1y", custom: "6m" };

export function evolutionRangeFor(preset: ExplorerPreset): EvolutionRangeKey {
  return EVOLUTION_BY_PRESET[preset];
}

export function activeFilterCount(params: StatsParams): number {
  return [params.accountId, params.categoryId, params.merchant, params.nature].filter((value) => value != null).length;
}
