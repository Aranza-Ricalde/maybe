import { after } from "next/server";
import { requireUser } from "@/app/lib/dal";
import { isAccountOwnedByFamily, isTransactionOwnedByFamily } from "@/app/lib/authorization";
import { getFamilyAccounts, getFamilyCategories, getFamilyTransactionsPage, type TransactionFilters, type TransactionSort } from "@/app/lib/queries";
import { TransactionsPageClient } from "@/components/organisms/TransactionsPageClient";
import {
  deleteTransactionUseCase,
  recordTransactionUseCase,
  recordTransferUseCase,
  resolveTransactionConceptUseCase,
  updateTransactionUseCase,
} from "@/infrastructure/container";
import { revalidatePath } from "next/cache";

async function createTransaction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const accountId = Number(formData.get("accountId"));
  const categoryIdRaw = formData.get("categoryId");
  const amountInput = Number(formData.get("amount"));
  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  if (!accountId || !amountInput || !name || !date) return;
  if (!(await isAccountOwnedByFamily(accountId, user.familyId))) return;

  const transaction = await recordTransactionUseCase.execute({
    accountId,
    date,
    amountCents: Math.round(amountInput * 100),
    name,
    categoryId: categoryIdRaw ? Number(categoryIdRaw) : null,
    source: "manual",
  });
  after(() =>
    resolveTransactionConceptUseCase.execute(transaction.id, user.familyId).catch((err) => console.error("resolveTransactionConcept falló", err)),
  );
  revalidatePath("/transactions");
  revalidatePath("/");
}

async function updateTransactionAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const accountId = Number(formData.get("accountId"));
  const categoryIdRaw = formData.get("categoryId");
  const amountInput = Number(formData.get("amount"));
  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  if (!id || !accountId || !amountInput || !name || !date) return;
  if (!(await isTransactionOwnedByFamily(id, user.familyId))) return;
  if (!(await isAccountOwnedByFamily(accountId, user.familyId))) return;

  await updateTransactionUseCase.execute({
    id,
    accountId,
    date,
    amountCents: Math.round(amountInput * 100),
    name,
    categoryId: categoryIdRaw ? Number(categoryIdRaw) : null,
  });
  revalidatePath("/transactions");
  revalidatePath("/");
}

async function deleteTransactionAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isTransactionOwnedByFamily(id, user.familyId))) return;

  await deleteTransactionUseCase.execute(id);
  revalidatePath("/transactions");
  revalidatePath("/");
}

async function recordTransfer(formData: FormData) {
  "use server";
  const user = await requireUser();
  const kindRaw = String(formData.get("kind") ?? "");
  const fromAccountId = Number(formData.get("fromAccountId"));
  const toAccountId = Number(formData.get("toAccountId"));
  const amountInput = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!["transfer", "cc_payment", "loan_payment"].includes(kindRaw)) return;
  if (!fromAccountId || !toAccountId || !amountInput || !date) return;
  if (!(await isAccountOwnedByFamily(fromAccountId, user.familyId))) return;
  if (!(await isAccountOwnedByFamily(toAccountId, user.familyId))) return;

  await recordTransferUseCase.execute({
    kind: kindRaw as "transfer" | "cc_payment" | "loan_payment",
    fromAccountId,
    toAccountId,
    date,
    amountCents: Math.round(amountInput * 100),
    notes: notes || null,
  });
  revalidatePath("/transactions");
  revalidatePath("/");
}

async function fetchTransactionsPage(filters: TransactionFilters, sort: TransactionSort, page: number, pageSize: number) {
  "use server";
  const user = await requireUser();
  return getFamilyTransactionsPage(user.familyId, filters, sort, page, pageSize);
}

export default async function TransactionsPage() {
  const user = await requireUser();
  const [accountsList, categoriesList] = await Promise.all([getFamilyAccounts(user.familyId), getFamilyCategories(user.familyId)]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <TransactionsPageClient
      accounts={accountsList}
      categories={categoriesList}
      today={today}
      createTransactionAction={createTransaction}
      updateTransactionAction={updateTransactionAction}
      deleteTransactionAction={deleteTransactionAction}
      recordTransferAction={recordTransfer}
      fetchTransactionsPage={fetchTransactionsPage}
    />
  );
}
