"use client";

import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import { Text } from "@/components/atoms/Text";
import { EVOLUTION_RANGE_LABELS, EvolutionRangeButtons } from "@/components/molecules/EvolutionRangeButtons";
import { useAccountExplorer, type FetchAccountMovements, type LoadBalanceHistory } from "@/hooks/useAccountExplorer";
import type { EvolutionPoint } from "@/domain/evolution/rules";
import { ACCOUNT_TYPE_LABELS, formatCurrency, formatDate } from "@/lib/format";
import type { DebtAccountOverview } from "@/application/getDebtOverview";
import { DebtAccountDetails } from "./DebtAccountDetails";
import { EditAccountModal } from "@/components/molecules/EditAccountModal";
import { DeleteEntityButton } from "./DeleteEntityButton";
import { FIELD } from "@/lib/formFields";
import type { FormAction } from "@/lib/actionResult";
import { DataTable, type DataTableColumn } from "./DataTable";
import { LineEvolutionChart } from "./LineEvolutionChart";
import type { AccountRow } from "@/components/viewModels";
import type { AccountTransactionRow } from "@/hooks/useAccountExplorer";

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
  { key: "monto", header: "Monto", align: "right", cell: (t) => <CurrencyText cents={t.amountCents} withSign weight="medium" tone={t.amountCents >= 0 ? "success" : "default"} /> },
];

export interface AccountDetailSheetProps {
  account: AccountRow | null;
  debt: DebtAccountOverview | null;
  updateAccountAction: FormAction;
  deleteAccountAction: FormAction;
  initialSeries: EvolutionPoint[];
  loadBalanceHistory: LoadBalanceHistory;
  fetchTransactionsPage: FetchAccountMovements;
  today: string;
  onClose: () => void;
}

function AccountDetail({ account, debt, initialSeries, loadBalanceHistory, fetchTransactionsPage, today, updateAccountAction, deleteAccountAction }: Omit<AccountDetailSheetProps, "account" | "onClose" | "debt"> & { account: AccountRow; debt: DebtAccountOverview | null }) {
  const explorer = useAccountExplorer({ accounts: [{ id: account.id, name: account.name }], initialSeries, loadBalanceHistory, fetchTransactionsPage, today });
  const { range, series, isLoadingHistory, selectRange, table } = explorer;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className={`text-4xl font-semibold tracking-tight tabular-nums ${account.balanceCents < 0 ? "text-danger" : ""}`}>{formatCurrency(account.balanceCents)}</p>
        <div className="flex items-center gap-1">
          <EditAccountModal accountId={account.id} name={account.name} type={account.type} creditLimitCents={account.creditLimitCents} debtTerms={account.debtTerms} updateAccountAction={updateAccountAction} />
          <DeleteEntityButton noun="cuenta" name={account.name} id={account.id} idField={FIELD.accountId} helperText="Si ya tiene movimientos registrados, se archivará en vez de borrarse — tu historial no se pierde." action={deleteAccountAction} />
        </div>
      </div>
      <EvolutionRangeButtons value={range} onChange={selectRange} />
      {series ? (
        <LineEvolutionChart series={series} dateGranularity={range === "30d" ? "daily" : "monthly"} emptyMessage="Todavía no hay suficientes datos para graficar esta cuenta." tableCaption={`Saldo de ${account.name} — ${EVOLUTION_RANGE_LABELS[range]}`} />
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground" aria-live="polite">
          {isLoadingHistory ? "Cargando…" : "No se pudo cargar el saldo de esta cuenta."}
        </p>
      )}
      {debt && <DebtAccountDetails debt={debt} />}
      <div className="border-t pt-4">
        <EyebrowLabel className="mb-2">Movimientos recientes</EyebrowLabel>
        <DataTable
          ariaLabel={`Movimientos de ${account.name}`}
          columns={columns}
          rows={table.rows}
          getRowId={(t) => t.id}
          totalItems={table.total}
          page={table.page}
          pageSize={table.pageSize}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          isLoading={table.isLoading}
          emptyTitle="Sin movimientos en este periodo"
          emptyDescription="Prueba con un rango más amplio."
          itemsLabel="movimientos"
          wrapInCard={false}
        />
      </div>
    </div>
  );
}

export function AccountDetailSheet({ account, debt, onClose, ...rest }: AccountDetailSheetProps) {
  return (
    <ResponsiveDialog open={account != null} onOpenChange={(open) => !open && onClose()} title={account?.name ?? "Cuenta"} description={account ? ACCOUNT_TYPE_LABELS[account.type] : undefined} size="lg">
      {account && <AccountDetail key={account.id} account={account} debt={debt} {...rest} />}
    </ResponsiveDialog>
  );
}
