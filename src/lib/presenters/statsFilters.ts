import { SPENDING_NATURES, type SpendingNature } from "@/domain/categories/nature";
import type { StatsParams } from "@/domain/stats/params";
import type { ExplorerFilterValues } from "./explorer";

export function statsFilterValues(params: StatsParams): ExplorerFilterValues {
  return {
    accountId: params.accountId != null ? String(params.accountId) : "",
    categoryId: params.categoryId != null ? String(params.categoryId) : "",
    merchant: params.merchant ?? "",
    nature: params.nature ?? "",
  };
}

export function statsFilterPatch(key: keyof ExplorerFilterValues, value: string): Partial<StatsParams> {
  if (key === "merchant") return { merchant: value || null };
  if (key === "nature") return { nature: SPENDING_NATURES.includes(value as SpendingNature) ? (value as SpendingNature) : null };
  const id = value ? Number(value) : null;
  return key === "accountId" ? { accountId: id } : { categoryId: id };
}

export type StatsSort = "value" | "label";
export const STATS_SORT_OPTIONS = [
  { value: "value", label: "Mayor primero" },
  { value: "label", label: "Nombre" },
] as const;
