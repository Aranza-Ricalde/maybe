import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/lib/dal";
import { isAccountOwnedByFamily } from "@/app/lib/authorization";
import { getAccountTransactionsPage, getArchivedAccounts, getFamilyAccounts } from "@/app/lib/queries";
import { AccountsPageTemplate } from "@/components/templates/AccountsPageTemplate";
import { ACCOUNT_TYPES, type AccountType } from "@/domain/accounts/rules";
import { EVOLUTION_RANGES, type EvolutionPoint, type EvolutionRangeKey } from "@/domain/evolution/rules";
import {
  archiveOrDeleteAccountUseCase,
  createAccountUseCase,
  getAccountBalanceHistoryUseCase,
  restoreAccountUseCase,
  updateAccountUseCase,
} from "@/infrastructure/container";
import { DrizzleCashflowRepository } from "@/infrastructure/db/cashflow";

function creditLimitFromForm(formData: FormData): number | undefined {
  const raw = formData.get("creditLimitCents");
  if (!raw || raw === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

async function createAccount(formData: FormData) {
  "use server";
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  if (!name || !ACCOUNT_TYPES.includes(type as AccountType)) return;

  await createAccountUseCase.execute({
    familyId: user.familyId,
    name,
    type: type as AccountType,
    creditLimitCents: creditLimitFromForm(formData),
  });
  revalidatePath("/accounts");
  revalidatePath("/");
}

async function updateAccount(formData: FormData) {
  "use server";
  const user = await requireUser();
  const accountId = Number(formData.get("accountId"));
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  if (!accountId || !name || !ACCOUNT_TYPES.includes(type as AccountType)) return;
  if (!(await isAccountOwnedByFamily(accountId, user.familyId))) return;

  await updateAccountUseCase.execute({ id: accountId, name, type: type as AccountType, creditLimitCents: creditLimitFromForm(formData) });
  revalidatePath("/accounts");
  revalidatePath("/");
}

async function archiveOrDeleteAccount(formData: FormData) {
  "use server";
  const user = await requireUser();
  const accountId = Number(formData.get("accountId"));
  if (!accountId) return;
  if (!(await isAccountOwnedByFamily(accountId, user.familyId))) return;

  await archiveOrDeleteAccountUseCase.execute(accountId);
  revalidatePath("/accounts");
  revalidatePath("/");
}

async function restoreAccount(formData: FormData) {
  "use server";
  const user = await requireUser();
  const accountId = Number(formData.get("accountId"));
  if (!accountId) return;
  if (!(await isAccountOwnedByFamily(accountId, user.familyId))) return;

  await restoreAccountUseCase.execute(accountId);
  revalidatePath("/accounts");
  revalidatePath("/");
}

async function fetchAccountTransactionsPage(accountId: number, fromDate: string, toDate: string, page: number, pageSize: number) {
  "use server";
  const user = await requireUser();
  if (!(await isAccountOwnedByFamily(accountId, user.familyId))) return { rows: [], total: 0 };

  return getAccountTransactionsPage(accountId, fromDate, toDate, page, pageSize);
}

export default async function AccountsPage() {
  const user = await requireUser();
  const [accountsList, archivedAccounts] = await Promise.all([getFamilyAccounts(user.familyId), getArchivedAccounts(user.familyId)]);
  const cashflowRepo = new DrizzleCashflowRepository();
  const today = new Date().toISOString().slice(0, 10);

  const balances = await Promise.all(accountsList.map((a) => cashflowRepo.getCurrentBalanceCents([a.id], today)));

  const balanceHistoryFlat = await Promise.all(
    accountsList.flatMap((a) => EVOLUTION_RANGES.map((range) => getAccountBalanceHistoryUseCase.execute(a.id, range, today))),
  );

  const balanceHistory: Record<number, Record<EvolutionRangeKey, EvolutionPoint[]>> = {};
  let flatIndex = 0;
  for (const a of accountsList) {
    balanceHistory[a.id] = {} as Record<EvolutionRangeKey, EvolutionPoint[]>;
    for (const range of EVOLUTION_RANGES) {
      balanceHistory[a.id][range] = balanceHistoryFlat[flatIndex];
      flatIndex++;
    }
  }

  return (
    <AccountsPageTemplate
      accounts={accountsList.map((account, i) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balanceCents: balances[i],
        creditLimitCents: (account.details as { creditLimitCents?: number } | null)?.creditLimitCents ?? null,
      }))}
      archivedAccounts={archivedAccounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))}
      balanceHistory={balanceHistory}
      today={today}
      createAccountAction={createAccount}
      updateAccountAction={updateAccount}
      deleteAccountAction={archiveOrDeleteAccount}
      restoreAccountAction={restoreAccount}
      fetchTransactionsPage={fetchAccountTransactionsPage}
    />
  );
}
