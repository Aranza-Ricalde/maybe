import { useMemo, useState } from "react";
import { filterStatsRows, sortStatsRows, type StatsTableRow } from "@/lib/presenters/stats";
import type { StatsSort } from "@/lib/presenters/statsFilters";

export function useStatsTable(rows: StatsTableRow[]) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<StatsSort>("value");
  const visible = useMemo(() => sortStatsRows(filterStatsRows(rows, query), sort), [rows, query, sort]);
  return { query, setQuery, sort, setSort, visible };
}
