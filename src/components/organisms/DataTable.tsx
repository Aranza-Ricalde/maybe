import { Card, Pagination, Table } from "@heroui/react";
import type { ReactNode } from "react";
import { Select } from "@/components/atoms/Select";
import { Text } from "@/components/atoms/Text";
import { EmptyState } from "@/components/molecules/EmptyState";
import { buildPageList, paginationRange } from "@/lib/pagination";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export interface DataTableColumn<T extends object> {
  key: string;
  header: string;
  align?: "left" | "right";
  isRowHeader?: boolean;
  sortable?: boolean;
  cell: (row: T) => ReactNode;
}

export interface DataTableSortDescriptor {
  column: string;
  direction: "ascending" | "descending";
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
}

export function DataTable<T extends object>({
  ariaLabel,
  columns,
  rows,
  getRowId,
  totalItems,
  page,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  itemsLabel,
  minWidthClassName = "min-w-[480px]",
  wrapInCard = true,
  sortDescriptor,
  onSortChange,
}: DataTableProps<T>) {
  const { start, end, totalPages } = paginationRange(page, pageSize, totalItems);
  const pageList = buildPageList(page, totalPages);

  function handlePageSizeChange(newSize: number) {
    onPageSizeChange(newSize);
    onPageChange(1);
  }

  const Wrapper = wrapInCard ? Card : "div";

  return (
    <Wrapper className={`${wrapInCard ? "p-5 " : ""}transition-opacity ${isLoading ? "opacity-50" : "opacity-100"}`}>
      <Table variant="secondary">
        <Table.ScrollContainer>
          <Table.Content
            aria-label={ariaLabel}
            className={minWidthClassName}
            sortDescriptor={sortDescriptor}
            onSortChange={onSortChange ? (d) => onSortChange({ column: String(d.column), direction: d.direction }) : undefined}
          >
            <Table.Header>
              {columns.map((col) => (
                <Table.Column
                  key={col.key}
                  id={col.key}
                  isRowHeader={col.isRowHeader}
                  allowsSorting={col.sortable}
                  className={col.align === "right" ? "text-right" : undefined}
                >
                  {col.sortable
                    ? ({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>{col.header}</Table.SortableColumnHeader>
                    : col.header}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body items={rows} renderEmptyState={() => <EmptyState title={emptyTitle} description={emptyDescription} />}>
              {(row) => (
                <Table.Row id={getRowId(row)}>
                  {columns.map((col) => (
                    <Table.Cell key={col.key} className={col.align === "right" ? "text-right" : undefined}>
                      {col.cell(row)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>

        {totalItems > 0 && (
          <Table.Footer className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-2">
              <Text size="xs" tone="muted">
                Mostrar
              </Text>
              <Select uiSize="sm" value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>

            <Pagination size="sm">
              <Pagination.Summary>
                {start} a {end} de {totalItems} {itemsLabel}
              </Pagination.Summary>
              {totalPages > 1 && (
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous isDisabled={page === 1} onPress={() => onPageChange(Math.max(1, page - 1))}>
                      <Pagination.PreviousIcon />
                    </Pagination.Previous>
                  </Pagination.Item>
                  {pageList.map((p) =>
                    typeof p === "number" ? (
                      <Pagination.Item key={p}>
                        <Pagination.Link isActive={p === page} onPress={() => onPageChange(p)}>
                          {p}
                        </Pagination.Link>
                      </Pagination.Item>
                    ) : (
                      <Pagination.Item key={p}>
                        <Pagination.Ellipsis />
                      </Pagination.Item>
                    ),
                  )}
                  <Pagination.Item>
                    <Pagination.Next isDisabled={page === totalPages} onPress={() => onPageChange(Math.min(totalPages, page + 1))}>
                      <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              )}
            </Pagination>
          </Table.Footer>
        )}
      </Table>
    </Wrapper>
  );
}
