"use client";

import { Chip } from "@/components/atoms/Chip";
import { Text } from "@/components/atoms/Text";
import { PayPeriodModal } from "@/components/molecules/PayPeriodModal";
import { periodLabel } from "@/domain/payPeriod/rules";
import { ClientDataTable } from "./ClientDataTable";
import type { DataTableColumn } from "./DataTable";

export interface PayMonthRow {
  id: number;
  name: string;
  start: string;
  end: string;
  periodCount: number;
  isCurrent: boolean;
}

export interface PayMonthsTableProps {
  rows: PayMonthRow[];
  updateAction: (formData: FormData) => Promise<void> | void;
}

export function PayMonthsTable({ rows, updateAction }: PayMonthsTableProps) {
  const columns: DataTableColumn<PayMonthRow>[] = [
    {
      key: "name",
      header: "Mes",
      isRowHeader: true,
      cell: (m) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{m.name}</span>
          {m.isCurrent && (
            <Chip tone="success" className="text-xs">
              Actual
            </Chip>
          )}
        </div>
      ),
    },
    { key: "range", header: "Fechas", cell: (m) => <Text tone="muted">{periodLabel(m.start, m.end)}</Text> },
    { key: "count", header: "Quincenas", align: "right", cell: (m) => <Text tone="muted">{m.periodCount}</Text> },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (m) => (
        <div className="flex items-center justify-end gap-1">
          <PayPeriodModal mode="edit" action={updateAction} initialValues={m} editTitle={`Editar ${m.name}`} />
        </div>
      ),
    },
  ];

  return <ClientDataTable ariaLabel="Meses de pago" columns={columns} rows={rows} getRowId={(m) => m.id} emptyTitle="Sin periodos todavía" emptyDescription="Agrega tu primera quincena en la vista Quincenal." itemsLabel="meses" minWidthClassName="min-w-[420px]" wrapInCard={false} />;
}
