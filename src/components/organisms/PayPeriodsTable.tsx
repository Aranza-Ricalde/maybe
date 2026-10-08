"use client";

import type { FormAction } from "@/lib/actionResult";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/atoms/Text";
import { periodLabel } from "@/domain/payPeriod/rules";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { ClientDataTable } from "./ClientDataTable";
import type { DataTableColumn } from "./DataTable";
import { PayPeriodModal } from "@/components/molecules/PayPeriodModal";
import { FIELD } from "@/lib/formFields";

export interface PayPeriodRow {
  id: number;
  index: number;
  start: string;
  end: string;
  isCurrent: boolean;
}

export interface PayPeriodsTableProps {
  rows: PayPeriodRow[];
  updateAction: FormAction;
  deleteAction: FormAction;
}

export function PayPeriodsTable({ rows, updateAction, deleteAction }: PayPeriodsTableProps) {

  const columns: DataTableColumn<PayPeriodRow>[] = [
    {
      key: "index",
      header: "Quincena",
      isRowHeader: true,
      cell: (p) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">Quincena {p.index}</span>
          {p.isCurrent && (
            <Badge variant="success">
              Actual
            </Badge>
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
            hiddenFields={{ [FIELD.id]: p.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <ClientDataTable
      ariaLabel="Periodos de pago"
      columns={columns}
      rows={rows}
      getRowId={(p) => p.id}
      emptyTitle="Sin periodos todavía"
      emptyDescription="Agrega tu primera quincena arriba."
      itemsLabel="periodos"
      minWidthClassName="min-w-[420px]"
      wrapInCard={false}
    />
  );
}
