"use client";

import type { FormAction } from "@/lib/actionResult";
import type { ReactNode } from "react";
import type { TransactionFilters, TransactionSort } from "@/domain/ledger/filters";
import type { TransactionRowView } from "@/components/viewModels";
import { useRefreshSignal } from "@/hooks/useRefreshSignal";
import { PageHeader } from "@/components/molecules/PageHeader";
import { CreateTransactionModal } from "./CreateTransactionModal";
import { TransactionsExplorer } from "./TransactionsExplorer";
import type { TransactionFiltersValue } from "./TransactionsFilterBar";
import { TransferModal } from "./TransferModal";

type TransactionRow = TransactionRowView;

export interface TransactionsPageClientProps {
  accounts: { id: number; name: string }[];
  categories: { id: number; name: string; label?: string }[];
  today: string;
  initialFilters?: Partial<TransactionFiltersValue>;
  reviewSlot?: ReactNode;
  createTransactionAction: FormAction;
  updateTransactionAction: FormAction;
  deleteTransactionAction: FormAction;
  undoTransferAction?: FormAction;
  markTransferAction?: FormAction;
  recordTransferAction: FormAction;
  fetchTransactionsPage: (
    filters: TransactionFilters,
    sort: TransactionSort,
    page: number,
    pageSize: number,
  ) => Promise<{ rows: TransactionRow[]; total: number }>;
}

export function TransactionsPageClient({
  accounts,
  categories,
  today,
  initialFilters,
  reviewSlot,
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  undoTransferAction,
  markTransferAction,
  recordTransferAction,
  fetchTransactionsPage,
}: TransactionsPageClientProps) {
  const { signal: refreshSignal, withRefresh } = useRefreshSignal();

  return (
    <>
      <PageHeader
        title="Movimientos"
        subtitle="Todo lo que entra y sale, de todas tus cuentas."
        action={
          accounts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <TransferModal accounts={accounts} today={today} recordTransferAction={withRefresh(recordTransferAction)} />
              <CreateTransactionModal accounts={accounts} categories={categories} today={today} createTransactionAction={withRefresh(createTransactionAction)} />
            </div>
          )
        }
      />

      {reviewSlot}
      <TransactionsExplorer
        accounts={accounts}
        categories={categories}
        fetchTransactionsPage={fetchTransactionsPage}
        updateTransactionAction={updateTransactionAction}
        deleteTransactionAction={deleteTransactionAction}
        undoTransferAction={undoTransferAction}
        markTransferAction={markTransferAction}
        refreshSignal={refreshSignal}
        initialFilters={initialFilters}
      />
    </>
  );
}
