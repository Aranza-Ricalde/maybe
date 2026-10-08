"use client";

import type { FormAction } from "@/lib/actionResult";
import { useCallback, useState } from "react";
import type { TransactionFilters, TransactionSort } from "@/domain/ledger/filters";
import type { AccountOption, CategoryOption, TransactionRowView } from "@/components/viewModels";
import { Badge } from "@/components/ui/badge";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { DataTable, type DataTableColumn, type DataTableSortDescriptor } from "./DataTable";
import { TransactionRowActions } from "./TransactionRowActions";
import { EMPTY_TRANSACTION_FILTERS, hasActiveTransactionFilters, TransactionsFilterBar, type TransactionFiltersValue } from "./TransactionsFilterBar";
import { usePaginatedFilterTable } from "@/hooks/usePaginatedFilterTable";
import { amountSignTone, formatDate } from "@/lib/format";
import { toApiTransactionFilters } from "@/components/organisms/transactionFilters";

const KIND_CHIP: Partial<Record<string, string>> = {
  transfer: "Transferencia",
  cc_payment: "Pago de tarjeta",
  loan_payment: "Pago de deuda",
  adjustment: "Ajuste",
};

type TransactionRow = TransactionRowView;

export interface TransactionsExplorerProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
  fetchTransactionsPage: (
    filters: TransactionFilters,
    sort: TransactionSort,
    page: number,
    pageSize: number,
  ) => Promise<{ rows: TransactionRow[]; total: number }>;
  updateTransactionAction: FormAction;
  deleteTransactionAction: FormAction;
  undoTransferAction?: FormAction;
  markTransferAction?: FormAction;
  refreshSignal?: number;
  initialFilters?: Partial<TransactionFiltersValue>;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200] as const;

export function TransactionsExplorer({
  accounts,
  categories,
  fetchTransactionsPage,
  updateTransactionAction,
  deleteTransactionAction,
  undoTransferAction,
  markTransferAction,
  refreshSignal = 0,
  initialFilters,
}: TransactionsExplorerProps) {
  const [filters, setFilters] = useState<TransactionFiltersValue>({ ...EMPTY_TRANSACTION_FILTERS, ...initialFilters });

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

  const thenRefetch = (action: FormAction | undefined): FormAction => async (formData) => {
    const result = await action?.(formData);
    await refetch();
    return result;
  };

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
          <span className="flex flex-wrap items-center gap-2">
            <Text weight="medium">{t.name}</Text>
            {KIND_CHIP[t.kind] && <Badge variant="secondary">{KIND_CHIP[t.kind]}</Badge>}
          </span>
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
        <TransactionRowActions
          row={t}
          accounts={accounts}
          categories={categories}
          onUpdate={thenRefetch(updateTransactionAction)}
          onDelete={thenRefetch(deleteTransactionAction)}
          onUndoTransfer={undoTransferAction && thenRefetch(undoTransferAction)}
          onMarkTransfer={markTransferAction && thenRefetch(markTransferAction)}
        />
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
        mobileGroup={{ getKey: (t) => t.date, getLabel: formatDate, hiddenColumnKeys: ["date"] }}
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
