"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Text } from "@/components/atoms/Text";
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

const ACTIONS_COLUMN_KEY = "actions";

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

export interface DataTableMobileGroup<T extends object> {
  getKey: (row: T) => string;
  getLabel: (key: string) => string;
  hiddenColumnKeys: string[];
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
  mobileGroup?: DataTableMobileGroup<T>;
}

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

function MobileRow<T extends object>({ row, titleColumn, actionsColumn, detailColumns }: { row: T; titleColumn: DataTableColumn<T>; actionsColumn?: DataTableColumn<T>; detailColumns: DataTableColumn<T>[] }) {
  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 font-medium">{titleColumn.cell(row)}</div>
        {actionsColumn && <div className="flex shrink-0 items-center gap-1">{actionsColumn.cell(row)}</div>}
      </div>
      {detailColumns.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {detailColumns.map((column) => (
            <div key={column.key} className="flex min-w-0 flex-col">
              <dt className="text-xs text-muted-foreground">{column.header}</dt>
              <dd className="min-w-0 tabular-nums">{column.cell(row)}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

function MobileRows<T extends object>({ columns, rows, getRowId, group }: Pick<DataTableProps<T>, "columns" | "rows" | "getRowId"> & { group?: DataTableMobileGroup<T> }) {
  const hidden = new Set(group?.hiddenColumnKeys ?? []);
  const visible = columns.filter((column) => !hidden.has(column.key));
  const titleColumn = visible.find((column) => column.isRowHeader) ?? visible[0];
  const actionsColumn = visible.find((column) => column.key === ACTIONS_COLUMN_KEY);
  const detailColumns = visible.filter((column) => column !== titleColumn && column !== actionsColumn);
  const rowProps = { titleColumn, actionsColumn, detailColumns };

  if (!group) {
    return (
      <ul className="flex flex-col divide-y">
        {rows.map((row) => (
          <MobileRow key={getRowId(row)} row={row} {...rowProps} />
        ))}
      </ul>
    );
  }

  const sections: { key: string; rows: T[] }[] = [];
  for (const row of rows) {
    const key = group.getKey(row);
    const last = sections[sections.length - 1];
    if (last?.key === key) last.rows.push(row);
    else sections.push({ key, rows: [row] });
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <section key={section.key} aria-label={group.getLabel(section.key)}>
          <h3 className="border-b pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.getLabel(section.key)}</h3>
          <ul className="flex flex-col divide-y">
            {section.rows.map((row) => (
              <MobileRow key={getRowId(row)} row={row} {...rowProps} />
            ))}
          </ul>
        </section>
      ))}
    </div>
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
                  column.header
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
  mobileGroup,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
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
        <MobileRows columns={columns} rows={rows} getRowId={getRowId} group={mobileGroup} />
      ) : (
        <DesktopTable ariaLabel={ariaLabel} columns={columns} rows={rows} getRowId={getRowId} minWidthClassName={minWidthClassName} sortDescriptor={sortDescriptor} onSortChange={onSortChange} />
      )}

      {totalItems > 0 && (
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
