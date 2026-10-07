"use client";

import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { ClientDataTable } from "./ClientDataTable";
import type { DataTableColumn } from "./DataTable";
import { RecurringItemModal } from "./RecurringItemModal";
import { RecurringBudgetInclusionCell } from "@/components/molecules/RecurringBudgetInclusionCell";
import { RecurringStatusToggle } from "@/components/molecules/RecurringStatusToggle";
import { isBudgetRelevant, type BudgetInclusion } from "@/domain/recurring/budgetInclusion";
import { amountSignTone } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import type { AccountOption, CategoryOption } from "@/components/viewModels";

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
  budgetInclusion: BudgetInclusion | null;
}

export interface RecurringItemsTableProps {
  rows: RecurringItemRow[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
  toggleAction: (formData: FormData) => Promise<void> | void;
  budgetDecisionAction: (formData: FormData) => void;
}

export function RecurringItemsTable({ rows, accounts, categories, updateAction, deleteAction, toggleAction, budgetDecisionAction }: RecurringItemsTableProps) {
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
      key: "budget",
      header: "Como presupuesto",
      cell: (item) => (
        <RecurringBudgetInclusionCell itemId={item.id} isRelevant={isBudgetRelevant(item)} budgetInclusion={item.budgetInclusion} action={budgetDecisionAction} />
      ),
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
            action={updateAction}
            initialValues={{
              id: item.id,
              name: item.name,
              flow: item.flow,
              estimatedAmount: item.estimatedAmountCents / 100,
              categoryId: item.categoryId,
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
            hiddenFields={{ [FIELD.id]: item.id }}
            action={deleteAction}
          />
        </div>
      ),
    },
  ];

  return (
    <ClientDataTable
      ariaLabel="Recurrentes"
      columns={columns}
      rows={rows}
      getRowId={(item) => item.id}
      emptyTitle="Sin recurrentes todavía"
      emptyDescription="Crea uno manualmente o confirma un patrón detectado arriba."
      itemsLabel="recurrentes"
      minWidthClassName="min-w-[820px]"
    />
  );
}
