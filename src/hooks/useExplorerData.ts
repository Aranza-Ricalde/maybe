import { useEffect, useState } from "react";
import type { ExplorerFilters, ExplorerResult } from "@/domain/explorer/rules";
import { useDebouncedValue } from "./useDebouncedValue";

interface Loaded {
  key: string;
  result: ExplorerResult | null;
}

const DEBOUNCE_MS = 150;

export function useExplorerData(filters: ExplorerFilters, initialResult: ExplorerResult, load: (args: unknown) => Promise<ExplorerResult | null>) {
  const debounced = useDebouncedValue(filters, DEBOUNCE_MS);
  const key = JSON.stringify(debounced);
  const [loaded, setLoaded] = useState<Loaded>(() => ({ key: JSON.stringify(filters), result: initialResult }));

  useEffect(() => {
    if (loaded.key === key) return;
    let cancelled = false;
    load(debounced)
      .then((result) => {
        if (!cancelled) setLoaded({ key, result });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, result: null });
      });
    return () => {
      cancelled = true;
    };
  }, [key, debounced, load, loaded.key]);

  return { result: loaded.result, isLoading: loaded.key !== key, hasFailed: loaded.key === key && loaded.result === null };
}
