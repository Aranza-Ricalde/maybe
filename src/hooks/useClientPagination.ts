import { useMemo, useState } from "react";

export function useClientPagination<T>(rows: T[], initialPageSize: number) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);
  return { page, setPage, pageSize, setPageSize, pageRows };
}
