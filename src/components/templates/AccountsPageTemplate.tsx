import type { FormAction } from "@/lib/actionResult";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/molecules/EmptyState";
import { CreateAccountModal } from "@/components/molecules/CreateAccountModal";
import { StatBlock } from "@/components/molecules/StatBlock";
import { StatBlockRow } from "@/components/molecules/StatBlockRow";
import { formatCurrency } from "@/lib/format";
import type { AccountsTotals } from "@/domain/accounts/rules";
import { PageHeader } from "@/components/molecules/PageHeader";
import { AccountExplorerCard, type FetchAccountMovements, type LoadBalanceHistory } from "@/components/organisms/AccountExplorerCard";
import type { AccountsBalanceHistory } from "@/application/getAccountsBalanceHistory";
import { AccountsBalanceChart } from "@/components/organisms/AccountsBalanceChart";
import type { LoadAccountsHistory } from "@/hooks/useAccountsHistory";
import { AccountsTable, type AccountRow } from "@/components/organisms/AccountsTable";
import { ArchivedAccountsModal, type ArchivedAccountInput } from "@/components/organisms/ArchivedAccountsModal";
import type { EvolutionPoint } from "@/domain/evolution/rules";
import type { AccountOption } from "@/components/viewModels";

export interface AccountsPageTemplateProps {
  initialAccountsHistory: AccountsBalanceHistory;
  loadAccountsHistory: LoadAccountsHistory;
  totals: AccountsTotals;
  accounts: AccountRow[];
  archivedAccounts: ArchivedAccountInput[];
  initialBalanceSeries: EvolutionPoint[];
  loadBalanceHistory: LoadBalanceHistory;
  today: string;
  createAccountAction: FormAction;
  updateAccountAction: FormAction;
  deleteAccountAction: FormAction;
  restoreAccountAction: FormAction;
  fetchTransactionsPage: FetchAccountMovements;
}

export function AccountsPageTemplate({
  accounts,
  totals,
  initialAccountsHistory,
  loadAccountsHistory,
  archivedAccounts,
  initialBalanceSeries,
  loadBalanceHistory,
  today,
  createAccountAction,
  updateAccountAction,
  deleteAccountAction,
  restoreAccountAction,
  fetchTransactionsPage,
}: AccountsPageTemplateProps) {
  const explorerAccounts: AccountOption[] = accounts.map((a) => ({ id: a.id, name: a.name }));

  return (
    <>
      <PageHeader
        title="Cuentas"
        subtitle="Todas tus cuentas, en un solo lugar."
        action={
          <div className="flex items-center gap-4">
            <ArchivedAccountsModal accounts={archivedAccounts} restoreAccountAction={restoreAccountAction} />
            <CreateAccountModal createAccountAction={createAccountAction} />
          </div>
        }
      />

      {accounts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="Todavía no tienes cuentas" description="Agrega tu primera cuenta para empezar a registrar movimientos." />
          </CardContent>
        </Card>
      ) : (
        <>
          <StatBlockRow>
            <StatBlock label="Lo que tienes" value={formatCurrency(totals.assetsCents)} tooltip="Suma de tus cuentas de ahorro, cheques, efectivo y demás activos." />
            <StatBlock label="Lo que debes" value={formatCurrency(totals.liabilitiesCents)} tone={totals.liabilitiesCents > 0 ? "danger" : "default"} tooltip="Suma de tus tarjetas de crédito, préstamos y otros pasivos." />
            <StatBlock label="Patrimonio neto" value={formatCurrency(totals.netCents)} tone={totals.netCents < 0 ? "danger" : "default"} tooltip="Lo que tienes menos lo que debes." />
          </StatBlockRow>

          <AccountsTable rows={accounts} updateAccountAction={updateAccountAction} deleteAccountAction={deleteAccountAction} />
          <AccountsBalanceChart initial={initialAccountsHistory} load={loadAccountsHistory} />

          <AccountExplorerCard
            accounts={explorerAccounts}
            initialSeries={initialBalanceSeries}
            loadBalanceHistory={loadBalanceHistory}
            fetchTransactionsPage={fetchTransactionsPage}
            today={today}
          />
        </>
      )}
    </>
  );
}
