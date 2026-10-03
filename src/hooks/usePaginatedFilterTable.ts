import { useEffect, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";

export interface SortState<TField extends string> {
  field: TField;
  direction: "asc" | "desc";
}

export interface UsePaginatedFilterTableOptions<TRow, TFilters, TField extends string> {
  filters: TFilters;
  initialSort: SortState<TField>;
  fetchPage: (filters: TFilters, sort: SortState<TField>, page: number, pageSize: number) => Promise<{ rows: TRow[]; total: number }>;
  initialPageSize?: number;
  debounceMs?: number;
  refreshSignal?: number;
}

export interface UsePaginatedFilterTableResult<TRow, TField extends string> {
  rows: TRow[];
  total: number;
  isLoading: boolean;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  sort: SortState<TField>;
  setSort: (sort: SortState<TField>) => void;
  refetch: () => Promise<void>;
}

export function usePaginatedFilterTable<TRow, TFilters, TField extends string>({
  filters,
  initialSort,
  fetchPage,
  initialPageSize = 20,
  debounceMs = 300,
  refreshSignal = 0,
}: UsePaginatedFilterTableOptions<TRow, TFilters, TField>): UsePaginatedFilterTableResult<TRow, TField> {
  const debouncedFilters = useDebouncedValue(filters, debounceMs);
  const [sort, setSortState] = useState<SortState<TField>>(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [rows, setRows] = useState<TRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(debouncedFilters);

  if (debouncedFilters !== appliedFilters) {
    setAppliedFilters(debouncedFilters);
    setPage(1);
  }

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchPage(debouncedFilters, sort, page, pageSize).then((result) => {
      if (cancelled) return;
      setRows(result.rows);
      setTotal(result.total);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedFilters, sort, page, pageSize, fetchPage, refreshSignal]);

  async function refetch() {
    setIsLoading(true);
    const result = await fetchPage(debouncedFilters, sort, page, pageSize);
    setRows(result.rows);
    setTotal(result.total);
    setIsLoading(false);
  }

  function setSort(next: SortState<TField>) {
    setSortState(next);
    setPage(1);
  }

  return { rows, total, isLoading, page, setPage, pageSize, setPageSize, sort, setSort, refetch };
}
