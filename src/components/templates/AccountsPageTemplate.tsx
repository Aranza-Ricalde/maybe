import { Card } from "@heroui/react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { CreateAccountModal } from "@/components/molecules/CreateAccountModal";
import { PageHeader } from "@/components/molecules/PageHeader";
import { AccountExplorerCard, type AccountExplorerOption, type AccountTransactionRow } from "@/components/organisms/AccountExplorerCard";
import { AccountsTable, type AccountRow } from "@/components/organisms/AccountsTable";
import { ArchivedAccountsModal, type ArchivedAccountInput } from "@/components/organisms/ArchivedAccountsModal";
import type { EvolutionPoint, EvolutionRangeKey } from "@/domain/evolution/rules";

export interface AccountsPageTemplateProps {
  accounts: AccountRow[];
  archivedAccounts: ArchivedAccountInput[];
  balanceHistory: Record<number, Record<EvolutionRangeKey, EvolutionPoint[]>>;
  today: string;
  createAccountAction: (formData: FormData) => Promise<void> | void;
  updateAccountAction: (formData: FormData) => Promise<void> | void;
  deleteAccountAction: (formData: FormData) => Promise<void> | void;
  restoreAccountAction: (formData: FormData) => Promise<void> | void;
  fetchTransactionsPage: (
    accountId: number,
    fromDate: string,
    toDate: string,
    page: number,
    pageSize: number,
  ) => Promise<{ rows: AccountTransactionRow[]; total: number }>;
}

export function AccountsPageTemplate({
  accounts,
  archivedAccounts,
  balanceHistory,
  today,
  createAccountAction,
  updateAccountAction,
  deleteAccountAction,
  restoreAccountAction,
  fetchTransactionsPage,
}: AccountsPageTemplateProps) {
  const explorerAccounts: AccountExplorerOption[] = accounts.map((a) => ({ id: a.id, name: a.name }));

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
            balanceHistory={balanceHistory}
            fetchTransactionsPage={fetchTransactionsPage}
            today={today}
          />
        </>
      )}
    </>
  );
}
