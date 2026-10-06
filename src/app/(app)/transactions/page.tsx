import { getTransactionsPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { TransactionsPageClient } from "@/components/organisms/TransactionsPageClient";
import { CaptureReviewBanner } from "@/components/organisms/CaptureReviewBanner";
import { TransferReviewBanner } from "@/components/organisms/TransferReviewBanner";
import {
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
import type { TransactionsSearchParams } from "@/domain/shared/routes";
import { todayIso } from "@/lib/today";

const TRANSFER_REVIEW_KEY = "transfer-review";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<TransactionsSearchParams> }) {
  const user = await requireUser();
  const { transferSuggestions, pendingCaptures, ...data } = await getTransactionsPageUseCase.execute(user.familyId, todayIso(), await searchParams);

  return (
    <TransactionsPageClient
      {...data}
      reviewSlot={
        <>
          <CaptureReviewBanner captures={pendingCaptures} categories={data.categories} confirmAction={confirmCaptureAction} />
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
