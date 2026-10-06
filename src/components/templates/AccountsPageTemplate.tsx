import { Card } from "@heroui/react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { CreateAccountModal } from "@/components/molecules/CreateAccountModal";
import { PageHeader } from "@/components/molecules/PageHeader";
import { AccountExplorerCard, type FetchAccountMovements, type LoadBalanceHistory } from "@/components/organisms/AccountExplorerCard";
import { AccountsTable, type AccountRow } from "@/components/organisms/AccountsTable";
import { ArchivedAccountsModal, type ArchivedAccountInput } from "@/components/organisms/ArchivedAccountsModal";
import type { EvolutionPoint } from "@/domain/evolution/rules";
import type { AccountOption } from "@/components/viewModels";

export interface AccountsPageTemplateProps {
  accounts: AccountRow[];
  archivedAccounts: ArchivedAccountInput[];
  initialBalanceSeries: EvolutionPoint[];
  loadBalanceHistory: LoadBalanceHistory;
  today: string;
  createAccountAction: (formData: FormData) => Promise<void> | void;
  updateAccountAction: (formData: FormData) => Promise<void> | void;
  deleteAccountAction: (formData: FormData) => Promise<void> | void;
  restoreAccountAction: (formData: FormData) => Promise<void> | void;
  fetchTransactionsPage: FetchAccountMovements;
}

export function AccountsPageTemplate({
  accounts,
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
        <Card className="p-5">
          <EmptyState title="Todavía no tienes cuentas" description="Agrega tu primera cuenta para empezar a registrar movimientos." />
        </Card>
      ) : (
        <>
          <AccountsTable rows={accounts} updateAccountAction={updateAccountAction} deleteAccountAction={deleteAccountAction} />
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
