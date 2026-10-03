"use client";

import { useMemo, useState } from "react";
import { Chip } from "@/components/atoms/Chip";
import { Text } from "@/components/atoms/Text";
import { periodLabel } from "@/domain/payPeriod/rules";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { DataTable, type DataTableColumn } from "./DataTable";
import { PayPeriodModal } from "@/components/molecules/PayPeriodModal";

export interface PayPeriodRow {
  id: number;
  index: number;
  start: string;
  end: string;
  isCurrent: boolean;
}

export interface PayPeriodsTableProps {
  rows: PayPeriodRow[];
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
}

const PAGE_SIZE = 10;

export function PayPeriodsTable({ rows, updateAction, deleteAction }: PayPeriodsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  const columns: DataTableColumn<PayPeriodRow>[] = [
    {
      key: "index",
      header: "Quincena",
      isRowHeader: true,
      cell: (p) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">Quincena {p.index}</span>
          {p.isCurrent && (
            <Chip tone="success" className="text-xs">
              Actual
            </Chip>
          )}
        </div>
      ),
    },
    {
      key: "range",
      header: "Fechas",
      cell: (p) => <Text tone="muted">{periodLabel(p.start, p.end)}</Text>,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          <PayPeriodModal mode="edit" action={updateAction} initialValues={p} />
          <ConfirmDeleteButton
            title="Eliminar periodo"
            triggerAriaLabel={`Eliminar Quincena ${p.index}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">Quincena {p.index}</span> ({periodLabel(p.start, p.end)})?
              </>
            }
            hiddenFields={{ id: p.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Periodos de pago"
      columns={columns}
      rows={pageRows}
      getRowId={(p) => p.id}
      totalItems={rows.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      emptyTitle="Sin periodos todavía"
      emptyDescription="Agrega tu primera quincena arriba."
      itemsLabel="periodos"
      minWidthClassName="min-w-[420px]"
      wrapInCard={false}
    />
  );
}
