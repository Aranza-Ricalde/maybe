import type { ReactNode } from "react";

export interface DataTableColumn<T extends object> {
  key: string;
  header: string;
  headerHint?: string;
  align?: "left" | "right";
  isRowHeader?: boolean;
  sortable?: boolean;
  mobileRole?: "amount" | "subtitle";
  cell: (row: T) => ReactNode;
}

export interface DataTableSortDescriptor {
  column: string;
  direction: "ascending" | "descending";
}

export interface DataTableMobileGroup<T extends object> {
  getKey: (row: T) => string;
  getLabel: (key: string) => string;
  hiddenColumnKeys: string[];
  getSummary?: (rows: T[]) => string;
}

export interface DataTableMobileOptions<T extends object> {
  group?: DataTableMobileGroup<T>;
  compact?: boolean;
  revealActions?: boolean;
  loadMoreStep?: number;
}

export interface DataTableProps<T extends object> {
  ariaLabel: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  totalItems: number;
  page: number;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  itemsLabel: string;
  minWidthClassName?: string;
  wrapInCard?: boolean;
  sortDescriptor?: DataTableSortDescriptor;
  onSortChange?: (descriptor: DataTableSortDescriptor) => void;
  mobile?: DataTableMobileOptions<T>;
}
