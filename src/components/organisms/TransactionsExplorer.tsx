"use client";

import { useCallback, useState } from "react";
import type { getFamilyTransactionsPage, TransactionFilters, TransactionSort } from "@/app/lib/queries";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { DataTable, type DataTableColumn, type DataTableSortDescriptor } from "./DataTable";
import { EditTransactionModal } from "./EditTransactionModal";
import {
  EMPTY_TRANSACTION_FILTERS,
  hasActiveTransactionFilters,
  TransactionsFilterBar,
  type TransactionFiltersValue,
  type TransactionsFilterBarAccountOption,
  type TransactionsFilterBarCategoryOption,
} from "./TransactionsFilterBar";
import { usePaginatedFilterTable } from "@/hooks/usePaginatedFilterTable";
import { amountSignTone, formatDate } from "@/lib/format";
import { toApiTransactionFilters } from "@/lib/transactionFilters";

type TransactionRow = Awaited<ReturnType<typeof getFamilyTransactionsPage>>["rows"][number];

export interface TransactionsExplorerProps {
  accounts: TransactionsFilterBarAccountOption[];
  categories: TransactionsFilterBarCategoryOption[];
  fetchTransactionsPage: (
    filters: TransactionFilters,
    sort: TransactionSort,
    page: number,
    pageSize: number,
  ) => Promise<{ rows: TransactionRow[]; total: number }>;
  updateTransactionAction: (formData: FormData) => Promise<void> | void;
  deleteTransactionAction: (formData: FormData) => Promise<void> | void;
  refreshSignal?: number;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200] as const;

export function TransactionsExplorer({
  accounts,
  categories,
  fetchTransactionsPage,
  updateTransactionAction,
  deleteTransactionAction,
  refreshSignal = 0,
}: TransactionsExplorerProps) {
  const [filters, setFilters] = useState<TransactionFiltersValue>(EMPTY_TRANSACTION_FILTERS);

  const fetchPage = useCallback(
    (f: TransactionFiltersValue, sort: TransactionSort, page: number, pageSize: number) =>
      fetchTransactionsPage(toApiTransactionFilters(f), sort, page, pageSize),
    [fetchTransactionsPage],
  );

  const { rows, total, isLoading, page, setPage, pageSize, setPageSize, sort, setSort, refetch } = usePaginatedFilterTable<
    TransactionRow,
    TransactionFiltersValue,
    TransactionSort["field"]
  >({
    filters,
    initialSort: { field: "date", direction: "desc" },
    fetchPage,
    refreshSignal,
  });

  async function handleUpdate(formData: FormData) {
    await updateTransactionAction(formData);
    await refetch();
  }

  async function handleDelete(formData: FormData) {
    await deleteTransactionAction(formData);
    await refetch();
  }

  function handleSortChange(descriptor: DataTableSortDescriptor) {
    setSort({ field: descriptor.column as TransactionSort["field"], direction: descriptor.direction === "ascending" ? "asc" : "desc" });
  }

  const columns: DataTableColumn<TransactionRow>[] = [
    { key: "date", header: "Fecha", sortable: true, cell: (t) => formatDate(t.date) },
    {
      key: "name",
      header: "Movimiento",
      isRowHeader: true,
      sortable: true,
      cell: (t) => (
        <>
          <Text weight="medium">{t.name}</Text>
          <Text size="xs" tone="muted">
            {t.accountName}
            {t.categoryName ? ` · ${t.categoryName}` : ""}
          </Text>
        </>
      ),
    },
    {
      key: "amount",
      header: "Monto",
      align: "right",
      sortable: true,
      cell: (t) => <CurrencyText cents={t.amountCents} withSign weight="medium" tone={amountSignTone(t.amountCents)} />,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (t) => (
        <div className="flex items-center justify-end gap-1">
          <EditTransactionModal
            accounts={accounts}
            categories={categories}
            action={handleUpdate}
            initialValues={{ id: t.id, accountId: t.accountId, categoryId: t.categoryId, name: t.name, amountCents: t.amountCents, date: t.date }}
          />
          <ConfirmDeleteButton
            title="Eliminar movimiento"
            triggerAriaLabel={`Eliminar ${t.name}`}
            confirmQuestion={
              <>
                ¿Eliminar <span className="font-semibold">&ldquo;{t.name}&rdquo;</span>?
              </>
            }
            helperText="Tu saldo y tus totales de categoría se ajustan solos para que todo siga cuadrando."
            hiddenFields={{ id: t.id }}
            action={handleDelete}
          />
        </div>
      ),
    },
  ];

  const sortDescriptor: DataTableSortDescriptor = { column: sort.field, direction: sort.direction === "asc" ? "ascending" : "descending" };
  const filtersActive = hasActiveTransactionFilters(filters);

  return (
    <div className="flex flex-col gap-4">
      <TransactionsFilterBar accounts={accounts} categories={categories} value={filters} onChange={setFilters} />

      <DataTable
        ariaLabel="Movimientos"
        columns={columns}
        rows={rows}
        getRowId={(t) => t.id}
        totalItems={total}
        page={page}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortDescriptor={sortDescriptor}
        onSortChange={handleSortChange}
        isLoading={isLoading}
        emptyTitle={filtersActive ? "Sin resultados" : "Sin movimientos todavía"}
        emptyDescription={filtersActive ? "Prueba con otros filtros." : "Registra tu primer movimiento, impórtalo por CSV, o mándaselo al bot de Telegram."}
        itemsLabel="movimientos"
        minWidthClassName="min-w-[680px]"
      />
    </div>
  );
}
