"use client";

import { useMemo, useState } from "react";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { DataTable, type DataTableColumn } from "./DataTable";
import { RecurringItemModal, type RecurringItemAccountOption, type RecurringItemCategoryOption, type RecurringItemConceptOption } from "./RecurringItemModal";
import { RecurringStatusToggle } from "@/components/molecules/RecurringStatusToggle";
import { amountSignTone } from "@/lib/format";

export interface RecurringItemRow {
  id: number;
  name: string;
  flow: "income" | "expense";
  estimatedAmountCents: number;
  categoryId: number | null;
  conceptId: number | null;
  accountId: number | null;
  dayOfMonth: number;
  status: "active" | "paused";
}

export interface RecurringItemsTableProps {
  rows: RecurringItemRow[];
  accounts: RecurringItemAccountOption[];
  categories: RecurringItemCategoryOption[];
  concepts: RecurringItemConceptOption[];
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
  toggleAction: (formData: FormData) => Promise<void> | void;
}

const PAGE_SIZE = 10;

export function RecurringItemsTable({ rows, accounts, categories, concepts, updateAction, deleteAction, toggleAction }: RecurringItemsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));

  const columns: DataTableColumn<RecurringItemRow>[] = [
    { key: "name", header: "Nombre", isRowHeader: true, cell: (item) => <span className="font-medium">{item.name}</span> },
    {
      key: "amount",
      header: "Monto",
      align: "right",
      cell: (item) => <CurrencyText cents={item.estimatedAmountCents} withSign weight="medium" tone={amountSignTone(item.estimatedAmountCents)} />,
    },
    { key: "day", header: "Día", cell: (item) => `Día ${item.dayOfMonth}` },
    {
      key: "detail",
      header: "Cuenta / Categoría",
      cell: (item) => (
        <Text tone="muted">
          {item.accountId != null ? (accountNameById.get(item.accountId) ?? "—") : "—"}
          {item.categoryId != null ? ` · ${categoryNameById.get(item.categoryId) ?? "—"}` : ""}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (item) => <RecurringStatusToggle itemId={item.id} isActive={item.status === "active"} toggleAction={toggleAction} />,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1">
          <RecurringItemModal
            mode="edit"
            accounts={accounts}
            categories={categories}
            concepts={concepts}
            action={updateAction}
            initialValues={{
              id: item.id,
              name: item.name,
              flow: item.flow,
              estimatedAmount: item.estimatedAmountCents / 100,
              categoryId: item.categoryId,
              conceptId: item.conceptId,
              accountId: item.accountId,
              dayOfMonth: item.dayOfMonth,
            }}
          />
          <ConfirmDeleteButton
            title="Eliminar recurrente"
            triggerAriaLabel={`Eliminar ${item.name}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">&ldquo;{item.name}&rdquo;</span>?
              </>
            }
            helperText="No afecta los movimientos que ya registraste, solo deja de proyectarse hacia adelante."
            hiddenFields={{ id: item.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Recurrentes"
      columns={columns}
      rows={pageRows}
      getRowId={(item) => item.id}
      totalItems={rows.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      emptyTitle="Sin recurrentes todavía"
      emptyDescription="Crea uno manualmente o confirma un patrón detectado arriba."
      itemsLabel="recurrentes"
      minWidthClassName="min-w-[640px]"
    />
  );
}
