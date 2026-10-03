"use client";

import { useState } from "react";
import type { getFamilyTransactionsPage, TransactionFilters, TransactionSort } from "@/app/lib/queries";
import { PageHeader } from "@/components/molecules/PageHeader";
import { CreateTransactionModal } from "./CreateTransactionModal";
import { TransactionsExplorer } from "./TransactionsExplorer";
import { TransferModal } from "./TransferModal";

type TransactionRow = Awaited<ReturnType<typeof getFamilyTransactionsPage>>["rows"][number];

export interface TransactionsPageClientProps {
  accounts: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  today: string;
  createTransactionAction: (formData: FormData) => Promise<void> | void;
  updateTransactionAction: (formData: FormData) => Promise<void> | void;
  deleteTransactionAction: (formData: FormData) => Promise<void> | void;
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
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
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

      <TransactionsExplorer
        accounts={accounts}
        categories={categories}
        fetchTransactionsPage={fetchTransactionsPage}
        updateTransactionAction={updateTransactionAction}
        deleteTransactionAction={deleteTransactionAction}
        refreshSignal={refreshSignal}
      />
    </>
  );
}
