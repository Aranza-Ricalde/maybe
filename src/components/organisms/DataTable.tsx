"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { InfoTooltip } from "@/components/molecules/InfoTooltip";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildPageList, paginationRange } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

import type { DataTableColumn, DataTableMobileGroup, DataTableMobileOptions, DataTableProps, DataTableSortDescriptor } from "./dataTableTypes";
import { MobileRows } from "./DataTableMobileRows";

export type { DataTableColumn, DataTableMobileGroup, DataTableMobileOptions, DataTableProps, DataTableSortDescriptor };

interface SortableHeaderProps {
  label: string;
  direction: DataTableSortDescriptor["direction"] | null;
  align: "left" | "right";
  onToggle: () => void;
}

function SortableHeader({ label, direction, align, onToggle }: SortableHeaderProps) {
  return (
    <Button type="button" variant="ghost" size="sm" className={cn("-mx-2.5 font-medium", align === "right" && "ml-auto")} onClick={onToggle}>
      {label}
      {direction === "ascending" && <ArrowUp />}
      {direction === "descending" && <ArrowDown />}
    </Button>
  );
}

function DesktopTable<T extends object>({ ariaLabel, columns, rows, getRowId, minWidthClassName, sortDescriptor, onSortChange }: Pick<DataTableProps<T>, "ariaLabel" | "columns" | "rows" | "getRowId" | "minWidthClassName" | "sortDescriptor" | "onSortChange">) {
  return (
    <Table aria-label={ariaLabel} className={minWidthClassName}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => {
            const align = column.align ?? "left";
            const direction = sortDescriptor?.column === column.key ? sortDescriptor.direction : null;
            return (
              <TableHead key={column.key} scope="col" aria-sort={direction ?? undefined} className={align === "right" ? "text-right" : undefined}>
                {column.sortable && onSortChange ? (
                  <SortableHeader label={column.header} direction={direction} align={align} onToggle={() => onSortChange({ column: column.key, direction: direction === "ascending" ? "descending" : "ascending" })} />
                ) : (
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {column.headerHint && <InfoTooltip label={column.headerHint} ariaLabel={`¿Qué significa ${column.header}?`} />}
                  </span>
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={getRowId(row)}>
            {columns.map((column) => (
              <TableCell key={column.key} className={column.align === "right" ? "text-right tabular-nums" : undefined}>
                {column.align === "right" ? <div className="flex justify-end">{column.cell(row)}</div> : column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
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
  minWidthClassName = "min-w-120",
  wrapInCard = true,
  sortDescriptor,
  onSortChange,
  mobile,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const loadMoreStep = mobile?.loadMoreStep;
  const { start, end, totalPages } = paginationRange(page, pageSize, totalItems);
  const pageList = buildPageList(page, totalPages);

  function handlePageSizeChange(newSize: number) {
    onPageSizeChange(newSize);
    onPageChange(1);
  }

  const body = (
    <div className={cn("flex flex-col gap-3 transition-opacity", isLoading ? "opacity-50" : "opacity-100")}>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : isMobile ? (
        <MobileRows columns={columns} rows={rows} getRowId={getRowId} group={mobile?.group} compact={mobile?.compact} revealActions={mobile?.revealActions} />
      ) : (
        <DesktopTable ariaLabel={ariaLabel} columns={columns} rows={rows} getRowId={getRowId} minWidthClassName={minWidthClassName} sortDescriptor={sortDescriptor} onSortChange={onSortChange} />
      )}

      {totalItems > 0 && isMobile && loadMoreStep != null && (
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">
            Mostrando {end} de {totalItems} {itemsLabel}
          </Text>
          {end < totalItems && (
            <Button type="button" variant="outline" className="w-full" onClick={() => onPageSizeChange(pageSize + loadMoreStep)}>
              Ver más
            </Button>
          )}
        </div>
      )}

      {totalItems > 0 && !(isMobile && loadMoreStep != null) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Text size="xs" tone="muted">
              Mostrar
            </Text>
            <NativeSelect size="sm" aria-label="Filas por página" value={pageSize} onChange={(event) => handlePageSizeChange(Number(event.target.value))}>
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Text size="xs" tone="muted">
              {start} a {end} de {totalItems} {itemsLabel}
            </Text>
            {totalPages > 1 && (
              <Pagination aria-label="Paginación" className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Página anterior" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
                      <ChevronLeft />
                    </Button>
                  </PaginationItem>
                  {pageList.map((token) =>
                    typeof token === "number" ? (
                      <PaginationItem key={token}>
                        <Button type="button" variant={token === page ? "outline" : "ghost"} size="icon-sm" aria-current={token === page ? "page" : undefined} aria-label={`Página ${token}`} onClick={() => onPageChange(token)}>
                          {token}
                        </Button>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={token}>
                        <span aria-hidden className="flex size-7 items-center justify-center">
                          <MoreHorizontal className="size-4" />
                        </span>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Página siguiente" disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
                      <ChevronRight />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return wrapInCard ? (
    <Card>
      <CardContent>{body}</CardContent>
    </Card>
  ) : (
    body
  );
}
