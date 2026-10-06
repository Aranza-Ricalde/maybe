"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Card } from "@heroui/react";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import { Text } from "@/components/atoms/Text";
import { EVOLUTION_RANGE_LABELS, EvolutionRangeButtons } from "@/components/molecules/EvolutionRangeButtons";
import { SelectField } from "@/components/molecules/FormField";
import { DataTable, type DataTableColumn } from "./DataTable";
import { LineEvolutionChart } from "./LineEvolutionChart";
import { pickDefaultAccountId } from "@/domain/accounts/rules";
import { rangeBounds, type EvolutionPoint, type EvolutionRangeKey } from "@/domain/evolution/rules";
import { usePaginatedFilterTable, type SortState } from "@/hooks/usePaginatedFilterTable";
import { formatDate } from "@/lib/format";
import type { AccountOption } from "@/components/viewModels";

export interface AccountTransactionRow {
  id: number;
  date: string;
  amountCents: number;
  name: string;
  categoryName: string | null;
}

export type FetchAccountMovements = (accountId: number, fromDate: string, toDate: string, page: number, pageSize: number) => Promise<{ rows: AccountTransactionRow[]; total: number }>;
export type LoadBalanceHistory = (accountId: number, range: EvolutionRangeKey) => Promise<EvolutionPoint[]>;

export interface AccountExplorerCardProps {
  accounts: AccountOption[];
  initialSeries: EvolutionPoint[];
  loadBalanceHistory: LoadBalanceHistory;
  fetchTransactionsPage: FetchAccountMovements;
  today: string;
}

interface AccountExplorerFilters {
  accountId: number | null;
  range: EvolutionRangeKey;
}

const columns: DataTableColumn<AccountTransactionRow>[] = [
  {
    key: "movimiento",
    header: "Movimiento",
    isRowHeader: true,
    cell: (t) => (
      <>
        <Text weight="medium">{t.name}</Text>
        <Text size="xs" tone="muted">
          {formatDate(t.date)}
          {t.categoryName ? ` · ${t.categoryName}` : ""}
        </Text>
      </>
    ),
  },
  {
    key: "monto",
    header: "Monto",
    align: "right",
    cell: (t) => <CurrencyText cents={t.amountCents} withSign weight="medium" tone={t.amountCents >= 0 ? "success" : "default"} />,
  },
];

const DEFAULT_RANGE: EvolutionRangeKey = "30d";
const historyKey = (accountId: number, range: EvolutionRangeKey) => `${accountId}:${range}`;

export function AccountExplorerCard({ accounts, initialSeries, loadBalanceHistory, fetchTransactionsPage, today }: AccountExplorerCardProps) {
  const [accountId, setAccountId] = useState<number | null>(() => pickDefaultAccountId(accounts));
  const [range, setRange] = useState<EvolutionRangeKey>(DEFAULT_RANGE);
  const [loadedHistory, setLoadedHistory] = useState<Record<string, EvolutionPoint[]>>(() => {
    const defaultAccountId = pickDefaultAccountId(accounts);
    return defaultAccountId == null ? {} : { [historyKey(defaultAccountId, DEFAULT_RANGE)]: initialSeries };
  });
  const [isLoadingHistory, startLoadingHistory] = useTransition();

  function select(nextAccountId: number, nextRange: EvolutionRangeKey) {
    setAccountId(nextAccountId);
    setRange(nextRange);
    const key = historyKey(nextAccountId, nextRange);
    if (loadedHistory[key]) return;
    startLoadingHistory(async () => {
      const series = await loadBalanceHistory(nextAccountId, nextRange);
      setLoadedHistory((current) => ({ ...current, [key]: series }));
    });
  }

  const filters = useMemo<AccountExplorerFilters>(() => ({ accountId, range }), [accountId, range]);

  const fetchPage = useCallback(
    async (f: AccountExplorerFilters, _sort: SortState<"date">, page: number, pageSize: number) => {
      if (f.accountId === null) return { rows: [], total: 0 };
      const fromDate = rangeBounds(f.range, today).fromDate;
      return fetchTransactionsPage(f.accountId, fromDate, today, page, pageSize);
    },
    [fetchTransactionsPage, today],
  );

  const { rows: transactions, total, isLoading, page, setPage, pageSize, setPageSize } = usePaginatedFilterTable<
    AccountTransactionRow,
    AccountExplorerFilters,
    "date"
  >({
    filters,
    initialSort: { field: "date", direction: "desc" },
    fetchPage,
    initialPageSize: 10,
  });

  if (accounts.length === 0 || accountId === null) return null;

  const series = loadedHistory[historyKey(accountId, range)];
  const selectedName = accounts.find((a) => a.id === accountId)?.name ?? "";

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Movimientos por cuenta</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-56">
            <SelectField
              ariaLabel="Cuenta"
              value={accountId != null ? String(accountId) : undefined}
              onChange={(v) => select(Number(v), range)}
              options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
            />
          </div>
          <EvolutionRangeButtons value={range} onChange={(next) => select(accountId, next)} />
        </div>

        <div className="mt-5">
          {series ? (
            <LineEvolutionChart
              series={series}
              dateGranularity={range === "30d" ? "daily" : "monthly"}
              emptyMessage="Todavía no hay suficientes datos para graficar esta cuenta."
              tableCaption={`Saldo de ${selectedName} — ${EVOLUTION_RANGE_LABELS[range]}`}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted" aria-live="polite">
              {isLoadingHistory ? "Cargando…" : "No se pudo cargar el saldo de esta cuenta."}
            </p>
          )}
        </div>

        <div className="mt-5 border-t border-separator pt-4">
          <EyebrowLabel className="mb-2">Movimientos de {selectedName}</EyebrowLabel>

          <DataTable
            ariaLabel={`Movimientos de ${selectedName}`}
            columns={columns}
            rows={transactions}
            getRowId={(t) => t.id}
            totalItems={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
            emptyTitle="Sin movimientos en este periodo"
            emptyDescription="Prueba con un rango más amplio, o elige otra cuenta."
            itemsLabel="movimientos"
            wrapInCard={false}
          />
        </div>
      </Card.Content>
    </Card>
  );
}
