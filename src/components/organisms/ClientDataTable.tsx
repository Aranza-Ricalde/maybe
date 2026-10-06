"use client";

import { useClientPagination } from "@/hooks/useClientPagination";
import { DEFAULT_PAGE_SIZE, DataTable, type DataTableProps } from "./DataTable";

export type ClientDataTableProps<T extends object> = Omit<DataTableProps<T>, "totalItems" | "page" | "pageSize" | "onPageChange" | "onPageSizeChange"> & {
  initialPageSize?: number;
};

export function ClientDataTable<T extends object>({ rows, initialPageSize = DEFAULT_PAGE_SIZE, ...tableProps }: ClientDataTableProps<T>) {
  const { page, setPage, pageSize, setPageSize, pageRows } = useClientPagination(rows, initialPageSize);

  return <DataTable {...tableProps} rows={pageRows} totalItems={rows.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />;
}
