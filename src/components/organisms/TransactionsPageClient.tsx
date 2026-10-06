"use client";

import { useState, type ReactNode } from "react";
import type { TransactionFilters, TransactionSort } from "@/domain/ledger/filters";
import type { TransactionRowView } from "@/components/viewModels";
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
  createTransactionAction: (formData: FormData) => Promise<void> | void;
  updateTransactionAction: (formData: FormData) => Promise<void> | void;
  deleteTransactionAction: (formData: FormData) => Promise<void> | void;
  undoTransferAction?: (formData: FormData) => Promise<void> | void;
  markTransferAction?: (formData: FormData) => Promise<void> | void;
  recordTransferAction: (formData: FormData) => Promise<void> | void;
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
  const [refreshSignal, setRefreshSignal] = useState(0);

  async function handleCreate(formData: FormData) {
    await createTransactionAction(formData);
    setRefreshSignal((n) => n + 1);
  }

  async function handleTransfer(formData: FormData) {
    await recordTransferAction(formData);
    setRefreshSignal((n) => n + 1);
  }

  return (
    <>
      <PageHeader
        title="Movimientos"
        subtitle="Todo lo que entra y sale, de todas tus cuentas."
        action={
          accounts.length > 0 && (
            <div className="flex items-center gap-2">
              <TransferModal accounts={accounts} today={today} recordTransferAction={handleTransfer} />
              <CreateTransactionModal accounts={accounts} categories={categories} today={today} createTransactionAction={handleCreate} />
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
