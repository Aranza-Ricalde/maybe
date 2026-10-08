"use client";

import { useState } from "react";
import type { FormAction } from "@/lib/actionResult";
import type { DebtAccountOverview } from "@/application/getDebtOverview";
import type { AccountsBalanceHistory } from "@/application/getAccountsBalanceHistory";
import { EmptyState } from "@/components/molecules/EmptyState";
import { CreateAccountModal } from "@/components/molecules/CreateAccountModal";
import { PillTabs } from "@/components/molecules/PillTabs";
import { MetricStrip } from "@/components/molecules/MetricStrip";
import { PageHeader } from "@/components/molecules/PageHeader";
import { AccountDetailSheet } from "@/components/organisms/AccountDetailSheet";
import { AccountsList } from "@/components/organisms/AccountsList";
import type { AccountRow } from "@/components/viewModels";
import { ArchivedAccountsModal, type ArchivedAccountInput } from "@/components/organisms/ArchivedAccountsModal";
import type { FetchAccountMovements, LoadBalanceHistory } from "@/hooks/useAccountExplorer";
import type { AccountsTotals } from "@/domain/accounts/rules";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_FILTERS, accountSeries, filterAccounts, type AccountFilter } from "@/lib/presenters/accounts";

export interface AccountsPageTemplateProps {
  initialAccountsHistory: AccountsBalanceHistory;
  totals: AccountsTotals;
  debts: DebtAccountOverview[];
  accounts: AccountRow[];
  archivedAccounts: ArchivedAccountInput[];
  loadBalanceHistory: LoadBalanceHistory;
  today: string;
  createAccountAction: FormAction;
  updateAccountAction: FormAction;
  deleteAccountAction: FormAction;
  restoreAccountAction: FormAction;
  fetchTransactionsPage: FetchAccountMovements;
}

export function AccountsPageTemplate({ accounts, totals, debts, initialAccountsHistory, archivedAccounts, loadBalanceHistory, today, createAccountAction, updateAccountAction, deleteAccountAction, restoreAccountAction, fetchTransactionsPage }: AccountsPageTemplateProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [filter, setFilter] = useState<AccountFilter>("all");
  const openAccount = accounts.find((account) => account.id === openId) ?? null;

  return (
    <>
      <PageHeader
        title="Cuentas"
        action={
          <div className="flex items-center gap-4">
            <ArchivedAccountsModal accounts={archivedAccounts} restoreAccountAction={restoreAccountAction} />
            <CreateAccountModal createAccountAction={createAccountAction} />
          </div>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState title="Todavía no tienes cuentas" description="Agrega tu primera cuenta para empezar a registrar movimientos." />
      ) : (
        <>
          <MetricStrip
            metrics={[
              { key: "net", label: "Patrimonio neto", value: formatCurrency(totals.netCents), tone: totals.netCents < 0 ? "danger" : "default" },
              { key: "assets", label: "Tienes", value: formatCurrency(totals.assetsCents) },
              { key: "debts", label: "Debes", value: formatCurrency(totals.liabilitiesCents), tone: totals.liabilitiesCents > 0 ? "danger" : "default" },
            ]}
          />

          <PillTabs options={ACCOUNT_FILTERS} value={filter} onChange={setFilter} ariaLabel="Filtrar cuentas" />

          <AccountsList rows={filterAccounts(accounts, filter)} history={initialAccountsHistory} onOpen={(account) => setOpenId(account.id)} />

          <AccountDetailSheet
            account={openAccount}
            debt={openAccount ? (debts.find((debt) => debt.id === openAccount.id) ?? null) : null}
            initialSeries={openAccount ? accountSeries(initialAccountsHistory, openAccount.id) : []}
            updateAccountAction={updateAccountAction}
            deleteAccountAction={deleteAccountAction}
            loadBalanceHistory={loadBalanceHistory}
            fetchTransactionsPage={fetchTransactionsPage}
            today={today}
            onClose={() => setOpenId(null)}
          />
        </>
      )}
    </>
  );
}
