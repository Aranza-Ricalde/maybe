"use client";

import { useCallback, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import { Text } from "@/components/atoms/Text";
import { SelectField } from "@/components/molecules/FormField";
import { DataTable, type DataTableColumn } from "./DataTable";
import { LineEvolutionChart } from "./LineEvolutionChart";
import { pickDefaultAccountId } from "@/domain/accounts/rules";
import { EVOLUTION_RANGES, rangeBounds, type EvolutionPoint, type EvolutionRangeKey } from "@/domain/evolution/rules";
import { usePaginatedFilterTable, type SortState } from "@/hooks/usePaginatedFilterTable";
import { formatDate } from "@/lib/format";

const RANGE_LABELS: Record<EvolutionRangeKey, string> = { "30d": "30 días", "3m": "3 meses", "6m": "6 meses", "1y": "1 año" };

export interface AccountTransactionRow {
  id: number;
  date: string;
  amountCents: number;
  name: string;
  categoryName: string | null;
}

export interface AccountExplorerOption {
  id: number;
  name: string;
}

export interface AccountExplorerCardProps {
  accounts: AccountExplorerOption[];
  balanceHistory: Record<number, Record<EvolutionRangeKey, EvolutionPoint[]>>;
  fetchTransactionsPage: (
    accountId: number,
    fromDate: string,
    toDate: string,
    page: number,
    pageSize: number,
  ) => Promise<{ rows: AccountTransactionRow[]; total: number }>;
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

export function AccountExplorerCard({ accounts, balanceHistory, fetchTransactionsPage, today }: AccountExplorerCardProps) {
  const [accountId, setAccountId] = useState<number | null>(() => pickDefaultAccountId(accounts));
  const [range, setRange] = useState<EvolutionRangeKey>("30d");

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

  const series = balanceHistory[accountId]?.[range] ?? [];
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
              value={accountId != null ? String(accountId) : undefined}
              onChange={(v) => setAccountId(Number(v))}
              options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EVOLUTION_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r ? "bg-separator text-foreground" : "text-muted hover:bg-separator"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <LineEvolutionChart
            series={series}
            dateGranularity={range === "30d" ? "daily" : "monthly"}
            emptyMessage="Todavía no hay suficientes datos para graficar esta cuenta."
            tableCaption={`Saldo de ${selectedName} — ${RANGE_LABELS[range]}`}
          />
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
