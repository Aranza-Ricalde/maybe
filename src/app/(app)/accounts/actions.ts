"use server";

import { runFormAction, runQuery } from "@/app/lib/actionRunner";
import { ownsAccount } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import { InvalidDebtTermsError } from "@/domain/debts/rules";
import type { EvolutionRangeKey } from "@/domain/evolution/rules";
import { accountsReader, archiveOrDeleteAccountUseCase, createAccountUseCase, getAccountBalanceHistoryUseCase, restoreAccountUseCase, updateAccountUseCase } from "@/infrastructure/container";
import { accountCreateForm, accountIdForm, accountPageArgs, accountUpdateForm, balanceHistoryArgs } from "@/lib/schemas";
import { todayIso } from "@/lib/today";

const NO_ROWS = { rows: [], total: 0 };

export async function createAccount(formData: FormData) {
  return runFormAction(formData, {
    schema: accountCreateForm,
    run: (input, user) => createAccountUseCase.execute({ familyId: user.familyId, ...input }),
    success: "Cuenta creada",
    revalidate: REVALIDATE.accounts,
  });
}

export async function updateAccount(formData: FormData) {
  return runFormAction(formData, {
    schema: accountUpdateForm,
    owns: [ownsAccount((input) => input.accountId)],
    run: ({ accountId, ...changes }) => updateAccountUseCase.execute({ id: accountId, ...changes }),
    success: "Cuenta actualizada",
    revalidate: REVALIDATE.accounts,
    tolerate: [InvalidDebtTermsError],
  });
}

export async function archiveOrDeleteAccount(formData: FormData) {
  return runFormAction(formData, {
    schema: accountIdForm,
    owns: [ownsAccount((input) => input.accountId)],
    run: ({ accountId }) => archiveOrDeleteAccountUseCase.execute(accountId),
    success: (_input, removal) => (removal === "archive" ? "Cuenta archivada: tiene movimientos, su historial se conserva" : "Cuenta eliminada"),
    revalidate: REVALIDATE.accounts,
  });
}

export async function restoreAccount(formData: FormData) {
  return runFormAction(formData, {
    schema: accountIdForm,
    owns: [ownsAccount((input) => input.accountId)],
    run: ({ accountId }) => restoreAccountUseCase.execute(accountId),
    success: "Cuenta reactivada",
    revalidate: REVALIDATE.accounts,
  });
}

export async function fetchAccountTransactionsPage(accountId: number, fromDate: string, toDate: string, page: number, pageSize: number) {
  return runQuery({ accountId, fromDate, toDate, page, pageSize }, {
    schema: accountPageArgs,
    owns: [ownsAccount((input) => input.accountId)],
    run: (input) => accountsReader.movementsPage(input.accountId, input.fromDate, input.toDate, input.page, input.pageSize),
    whenInvalid: NO_ROWS,
  });
}

export async function loadBalanceHistory(accountId: number, range: EvolutionRangeKey) {
  return runQuery({ accountId, range }, {
    schema: balanceHistoryArgs,
    owns: [ownsAccount((input) => input.accountId)],
    run: (input) => getAccountBalanceHistoryUseCase.execute(input.accountId, input.range, todayIso()),
    whenInvalid: [],
  });
}
