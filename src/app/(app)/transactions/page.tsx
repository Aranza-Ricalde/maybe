import { after } from "next/server";
import { classifyPendingWithAiUseCase, getTransactionsPageUseCase } from "@/infrastructure/container";
import { logFailure } from "@/lib/log";
import { requireUser } from "@/app/lib/dal";
import { TransactionsPageClient } from "@/components/organisms/TransactionsPageClient";
import { CaptureReviewBanner } from "@/components/organisms/CaptureReviewBanner";
import { CategoryReviewBanner } from "@/components/organisms/CategoryReviewBanner";
import { TransferReviewBanner } from "@/components/organisms/TransferReviewBanner";
import {
  categorizeProviderAction,
  confirmCaptureAction,
  confirmTransferPairAction,
  confirmTransferSingleAction,
  createTransaction,
  deleteTransactionAction,
  dismissTransferPairAction,
  dismissTransferSingleAction,
  fetchTransactionsPage,
  recordTransfer,
  undoTransferAction,
  updateTransactionAction,
} from "./actions";
import { NEW_TRANSACTION_FLAG, SEARCH_PARAM, type TransactionsSearchParams } from "@/domain/shared/routes";
import { todayIso } from "@/lib/today";

const TRANSFER_REVIEW_KEY = "transfer-review";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<TransactionsSearchParams> }) {
  const user = await requireUser();
  const params = await searchParams;
  if (classifyPendingWithAiUseCase.enabled) {
    after(() => classifyPendingWithAiUseCase.execute(user.familyId).catch((error) => logFailure("clasificación con IA en segundo plano falló", error)));
  }
  const { transferSuggestions, pendingCaptures, categoryReviewQueue, ...data } = await getTransactionsPageUseCase.execute(user.familyId, todayIso(), params);

  return (
    <TransactionsPageClient
      {...data}
      openCreateOnLoad={params[SEARCH_PARAM.newTransaction] === NEW_TRANSACTION_FLAG}
      reviewSlot={
        <>
          <CaptureReviewBanner captures={pendingCaptures} categories={data.categories} confirmAction={confirmCaptureAction} />
          <CategoryReviewBanner groups={categoryReviewQueue} categories={data.categories} categorizeAction={categorizeProviderAction} />
          <TransferReviewBanner
          key={TRANSFER_REVIEW_KEY}
          suggestions={transferSuggestions}
          actions={{
            confirmPair: confirmTransferPairAction,
            dismissPair: dismissTransferPairAction,
            confirmSingle: confirmTransferSingleAction,
            dismissSingle: dismissTransferSingleAction,
          }}
          />
        </>
      }
      createTransactionAction={createTransaction}
      updateTransactionAction={updateTransactionAction}
      deleteTransactionAction={deleteTransactionAction}
      undoTransferAction={undoTransferAction}
      markTransferAction={confirmTransferSingleAction}
      recordTransferAction={recordTransfer}
      fetchTransactionsPage={fetchTransactionsPage}
    />
  );
}
