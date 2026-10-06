import { getAccountsPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { AccountsPageTemplate } from "@/components/templates/AccountsPageTemplate";
import { todayIso } from "@/lib/today";
import { archiveOrDeleteAccount, createAccount, fetchAccountTransactionsPage, loadBalanceHistory, restoreAccount, updateAccount } from "./actions";

export default async function AccountsPage() {
  const user = await requireUser();
  const today = todayIso();
  const data = await getAccountsPageUseCase.execute(user.familyId, today);

  return (
    <AccountsPageTemplate
      {...data}
      today={today}
      loadBalanceHistory={loadBalanceHistory}
      createAccountAction={createAccount}
      updateAccountAction={updateAccount}
      deleteAccountAction={archiveOrDeleteAccount}
      restoreAccountAction={restoreAccount}
      fetchTransactionsPage={fetchAccountTransactionsPage}
    />
  );
}
