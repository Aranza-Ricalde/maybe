"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import { Text } from "@/components/atoms/Text";
import { EVOLUTION_RANGE_LABELS, EvolutionRangeButtons } from "@/components/molecules/EvolutionRangeButtons";
import { SelectField } from "@/components/molecules/FormField";
import { DataTable, type DataTableColumn } from "./DataTable";
import { LineEvolutionChart } from "./LineEvolutionChart";
import { useAccountExplorer, type AccountTransactionRow, type FetchAccountMovements, type LoadBalanceHistory, type UseAccountExplorerOptions } from "@/hooks/useAccountExplorer";
import { formatDate } from "@/lib/format";

export type { AccountTransactionRow, FetchAccountMovements, LoadBalanceHistory };

export type AccountExplorerCardProps = UseAccountExplorerOptions;

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

export function AccountExplorerCard(props: AccountExplorerCardProps) {
  const { accounts } = props;
  const { accountId, range, series, selectedName, isLoadingHistory, selectAccount, selectRange, table } = useAccountExplorer(props);
  const { rows: transactions, total, isLoading, page, setPage, pageSize, setPageSize } = table;

  if (accounts.length === 0 || accountId === null) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos por cuenta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-56">
            <SelectField
              ariaLabel="Cuenta"
              value={accountId != null ? String(accountId) : undefined}
              onChange={(v) => selectAccount(Number(v))}
              options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
            />
          </div>
          <EvolutionRangeButtons value={range} onChange={selectRange} />
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
            <p className="py-10 text-center text-sm text-muted-foreground" aria-live="polite">
              {isLoadingHistory ? "Cargando…" : "No se pudo cargar el saldo de esta cuenta."}
            </p>
          )}
        </div>

        <div className="mt-5 border-t border-border pt-4">
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
      </CardContent>
    </Card>
  );
}
