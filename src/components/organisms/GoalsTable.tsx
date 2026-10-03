"use client";

import { useMemo, useState } from "react";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { DataTable, type DataTableColumn } from "./DataTable";
import { GoalModal, type GoalAccountOption } from "./GoalModal";
import { formatCurrency } from "@/lib/format";

export interface GoalRow {
  id: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  currentCents: number;
  linkedAccountNames: string[];
  linkedAccountIds: number[];
}

export interface GoalsTableProps {
  rows: GoalRow[];
  accounts: GoalAccountOption[];
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
}

const PAGE_SIZE = 10;

export function GoalsTable({ rows, accounts, updateAction, deleteAction }: GoalsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  const columns: DataTableColumn<GoalRow>[] = [
    { key: "name", header: "Meta", isRowHeader: true, cell: (g) => <span className="font-medium">{g.name}</span> },
    {
      key: "progress",
      header: "Progreso",
      cell: (g) => {
        const current = Math.max(0, g.currentCents);
        const pct = g.targetAmountCents > 0 ? Math.min(100, Math.round((current / g.targetAmountCents) * 100)) : 0;
        return (
          <div className="min-w-32">
            <div className="flex items-center justify-between gap-2 text-xs">
              <CurrencyText cents={current} size="xs" />
              <Text size="xs" tone="muted" className="tabular-nums">
                de {formatCurrency(g.targetAmountCents)}
              </Text>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-default">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: "accounts",
      header: "Cuentas",
      cell: (g) => <span className="text-muted">{g.linkedAccountNames.length > 0 ? g.linkedAccountNames.join(", ") : "Ninguna"}</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (g) => (
        <div className="flex items-center justify-end gap-1">
          <GoalModal
            mode="edit"
            accounts={accounts}
            action={updateAction}
            initialValues={{
              id: g.id,
              name: g.name,
              targetAmountCents: g.targetAmountCents,
              targetDate: g.targetDate,
              linkedAccountIds: g.linkedAccountIds,
            }}
          />
          <ConfirmDeleteButton
            title="Eliminar meta"
            triggerAriaLabel={`Eliminar ${g.name}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">&ldquo;{g.name}&rdquo;</span>?
              </>
            }
            helperText="Tus cuentas y movimientos no se tocan — solo se borra esta meta y sus vínculos."
            hiddenFields={{ id: g.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Metas"
      columns={columns}
      rows={pageRows}
      getRowId={(g) => g.id}
      totalItems={rows.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      emptyTitle="Sin metas todavía"
      emptyDescription="Crea tu primera meta de ahorro arriba."
      itemsLabel="metas"
      minWidthClassName="min-w-[560px]"
    />
  );
}
