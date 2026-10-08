import type { StatsGroup, StatsMetric, StatsParams } from "@/domain/stats/params";

const GROUPS_BY_METRIC: Record<StatsMetric, readonly StatsGroup[]> = {
  expense: ["time", "category", "merchant"],
  income: ["time"],
  net: ["time"],
  balance: ["time", "account"],
};

export function availableGroups(metric: StatsMetric): readonly StatsGroup[] {
  return GROUPS_BY_METRIC[metric];
}

export function canProject(params: StatsParams): boolean {
  return params.metric === "balance" && params.group === "time" && params.accountId == null;
}

export function canCompare(params: StatsParams): boolean {
  return params.group === "time" && params.metric !== "balance";
}
