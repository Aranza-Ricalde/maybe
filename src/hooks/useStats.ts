import { useCallback, useEffect, useState } from "react";
import type { StatsData } from "@/application/getStats";
import { normalizeStatsParams, serializeStatsParams, type StatsParams } from "@/domain/stats/params";
import { useDebouncedValue } from "./useDebouncedValue";

export type LoadStats = (args: unknown) => Promise<StatsData | null>;

interface Snapshot {
  key: string;
  params: StatsParams;
  data: StatsData;
}

const DEBOUNCE_MS = 150;

export function useStats(initialParams: StatsParams, initialData: StatsData, load: LoadStats) {
  const [params, setParams] = useState(initialParams);
  const debounced = useDebouncedValue(params, DEBOUNCE_MS);
  const key = serializeStatsParams(debounced);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ key: serializeStatsParams(initialParams), params: initialParams, data: initialData }));
  const [failedKey, setFailedKey] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    window.history.replaceState(null, "", key ? `${path}?${key}` : path);
  }, [key]);

  useEffect(() => {
    if (snapshot.key === key) return;
    let cancelled = false;
    load(debounced)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setFailedKey(null);
          setSnapshot({ key, params: debounced, data });
        } else {
          setFailedKey(key);
        }
      })
      .catch(() => {
        if (!cancelled) setFailedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [key, debounced, load, snapshot.key]);

  const update = useCallback((patch: Partial<StatsParams>) => setParams((current) => normalizeStatsParams({ ...current, ...patch })), []);

  return {
    params,
    update,
    clearFilters: () => update({ accountId: null, categoryId: null, merchant: null, nature: null }),
    shown: { params: snapshot.params, data: snapshot.data },
    isLoading: snapshot.key !== key && failedKey !== key,
    hasFailed: failedKey === key,
  };
}
