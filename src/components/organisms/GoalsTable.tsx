"use client";

import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { ClientDataTable } from "./ClientDataTable";
import type { DataTableColumn } from "./DataTable";
import { GoalModal } from "./GoalModal";
import { formatCurrency } from "@/lib/format";
import { goalProgress } from "@/domain/dashboard/rules";
import { FIELD } from "@/lib/formFields";
import type { AccountOption } from "@/components/viewModels";

export interface GoalRow {
  id: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  currentCents: number;
  projection: { headline: string; detail?: string } | null;
  linkedAccountNames: string[];
  linkedAccountIds: number[];
}

export interface GoalsTableProps {
  rows: GoalRow[];
  accounts: AccountOption[];
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
}

export function GoalsTable({ rows, accounts, updateAction, deleteAction }: GoalsTableProps) {

  const columns: DataTableColumn<GoalRow>[] = [
    { key: "name", header: "Meta", isRowHeader: true, cell: (g) => <span className="font-medium">{g.name}</span> },
    {
      key: "progress",
      header: "Progreso",
      cell: (g) => {
        const { currentCents: current, percent } = goalProgress(g.currentCents, g.targetAmountCents);
        const pct = Math.round(percent * 100);
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
      key: "projection",
      header: "Al ritmo actual",
      cell: (g) =>
        g.projection ? (
          <div className="min-w-48 max-w-72">
            <Text size="xs" weight="medium">
              {g.projection.headline}
            </Text>
            {g.projection.detail && (
              <Text size="xs" tone="muted">
                {g.projection.detail}
              </Text>
            )}
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
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
            hiddenFields={{ [FIELD.id]: g.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <ClientDataTable
      ariaLabel="Metas"
      columns={columns}
      rows={rows}
      getRowId={(g) => g.id}
      emptyTitle="Sin metas todavía"
      emptyDescription="Crea tu primera meta de ahorro arriba."
      itemsLabel="metas"
      minWidthClassName="min-w-[760px]"
    />
  );
}
