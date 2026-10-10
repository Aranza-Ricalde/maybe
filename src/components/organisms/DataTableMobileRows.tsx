"use client";

import { useState } from "react";
import { InfoTooltip } from "@/components/molecules/InfoTooltip";
import { cn } from "@/lib/utils";
import type { DataTableColumn, DataTableMobileGroup, DataTableProps } from "./dataTableTypes";

const ACTIONS_COLUMN_KEY = "actions";

function MobileRowCompact<T extends object>({ row, titleColumn, amountColumn, subtitleColumn, actionsColumn, detailColumns, revealActions }: { row: T; titleColumn: DataTableColumn<T>; amountColumn?: DataTableColumn<T>; subtitleColumn?: DataTableColumn<T>; actionsColumn?: DataTableColumn<T>; detailColumns: DataTableColumn<T>[]; revealActions?: boolean }) {
  const [open, setOpen] = useState(false);
  const inlineActions = actionsColumn && !revealActions;
  const body = (
    <>
      <div className={cn("min-w-0 text-left font-medium", (amountColumn || inlineActions) && "row-span-2")}>
        {titleColumn.cell(row)}
        {subtitleColumn && <div className="text-xs font-normal text-muted-foreground">{subtitleColumn.cell(row)}</div>}
      </div>
      {(amountColumn || inlineActions) && (
        <div className="row-span-2 flex items-center justify-end gap-2 self-center">
          {amountColumn && <div className="text-right tabular-nums">{amountColumn.cell(row)}</div>}
          {inlineActions && <div className="flex items-center justify-end">{actionsColumn.cell(row)}</div>}
        </div>
      )}
    </>
  );

  return (
    <li className="py-2.5">
      {revealActions && actionsColumn ? (
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
          {body}
        </button>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">{body}</div>
      )}
      {revealActions && actionsColumn && open && <div className="flex items-center justify-end pt-1">{actionsColumn.cell(row)}</div>}
      {detailColumns.length > 0 && (!revealActions || open) && (
        <dl className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {detailColumns.map((column) => (
            <div key={column.key} className="flex items-center gap-1.5">
              <dt className="flex items-center gap-1">
                {column.header}:
                {column.headerHint && <InfoTooltip label={column.headerHint} ariaLabel={`¿Qué significa ${column.header}?`} />}
              </dt>
              <dd className="text-foreground">{column.cell(row)}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
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
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                {column.header}
                {column.headerHint && <InfoTooltip label={column.headerHint} ariaLabel={`¿Qué significa ${column.header}?`} />}
              </dt>
              <dd className="min-w-0 tabular-nums">{column.cell(row)}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

export function MobileRows<T extends object>({ columns, rows, getRowId, group, compact, revealActions }: Pick<DataTableProps<T>, "columns" | "rows" | "getRowId"> & { group?: DataTableMobileGroup<T>; compact?: boolean; revealActions?: boolean }) {
  const hidden = new Set(group?.hiddenColumnKeys ?? []);
  const visible = columns.filter((column) => !hidden.has(column.key));
  const titleColumn = visible.find((column) => column.isRowHeader) ?? visible[0];
  const actionsColumn = visible.find((column) => column.key === ACTIONS_COLUMN_KEY);
  const amountColumn = visible.find((column) => column.mobileRole === "amount");
  const subtitleColumn = visible.find((column) => column.mobileRole === "subtitle");
  const detailColumns = visible.filter((column) => column !== titleColumn && column !== actionsColumn && column !== amountColumn && column !== subtitleColumn);
  const rowProps = { titleColumn, actionsColumn, detailColumns };
  const renderRow = (row: T) => (amountColumn || subtitleColumn || compact ? <MobileRowCompact key={getRowId(row)} row={row} titleColumn={titleColumn} amountColumn={amountColumn} subtitleColumn={subtitleColumn} actionsColumn={actionsColumn} detailColumns={detailColumns} revealActions={revealActions} /> : <MobileRow key={getRowId(row)} row={row} {...rowProps} />);

  if (!group) {
    return (
      <ul className="flex flex-col divide-y">
        {rows.map(renderRow)}
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
          <h3 className="flex items-center justify-between border-b pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <span>{group.getLabel(section.key)}</span>
            {group.getSummary && <span className="tabular-nums">{group.getSummary(section.rows)}</span>}
          </h3>
          <ul className="flex flex-col divide-y">
            {section.rows.map(renderRow)}
          </ul>
        </section>
      ))}
    </div>
  );
}
