"use server";

import { after } from "next/server";
import { runFormAction, runQuery } from "@/app/lib/actionRunner";
import { ownsAccount, ownsCategory, ownsTransaction } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import { InvalidCaptureError } from "@/domain/captures/rules";
import { InvalidTransferReviewError } from "@/domain/transfers/rules";
import {
  confirmCaptureUseCase,
  deleteTransactionUseCase,
  recordTransactionUseCase,
  transactionsReader,
  recordTransferUseCase,
  resolveTransactionConceptUseCase,
  resolveTransferSuggestionUseCase,
  updateTransactionUseCase,
} from "@/infrastructure/container";
import type { TransactionFilters, TransactionSort } from "@/domain/ledger/filters";
import { logFailure } from "@/lib/log";
import {
  confirmCaptureForm,
  confirmTransferPairForm,
  confirmTransferSingleForm,
  dismissTransferPairForm,
  idForm,
  transactionForm,
  transactionIdForm,
  transactionsPageArgs,
  transferForm,
  updateTransactionForm,
} from "@/lib/schemas";

const NO_ROWS = { rows: [], total: 0 };

export async function createTransaction(formData: FormData) {
  return runFormAction(formData, {
    schema: transactionForm,
    owns: [ownsAccount((input) => input.accountId), ownsCategory((input) => input.categoryId)],
    run: async (input, user) => {
      const transaction = await recordTransactionUseCase.execute({ ...input, source: "manual" });
      after(() => resolveTransactionConceptUseCase.execute(transaction.id, user.familyId).catch((error) => logFailure("resolveTransactionConcept falló", error)));
    },
    revalidate: REVALIDATE.transactions,
  });
}

export async function updateTransactionAction(formData: FormData) {
  return runFormAction(formData, {
    schema: updateTransactionForm,
    owns: [ownsTransaction((input) => input.id), ownsAccount((input) => input.accountId), ownsCategory((input) => input.categoryId)],
    run: (input) => updateTransactionUseCase.execute(input),
    revalidate: REVALIDATE.transactions,
  });
}

export async function deleteTransactionAction(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsTransaction((input) => input.id)],
    run: (input) => deleteTransactionUseCase.execute(input.id),
    revalidate: REVALIDATE.transactions,
  });
}

export async function recordTransfer(formData: FormData) {
  return runFormAction(formData, {
    schema: transferForm,
    owns: [ownsAccount((input) => input.fromAccountId), ownsAccount((input) => input.toAccountId)],
    run: (input) => recordTransferUseCase.execute(input),
    revalidate: REVALIDATE.transactions,
  });
}

export async function fetchTransactionsPage(filters: TransactionFilters, sort: TransactionSort, page: number, pageSize: number) {
  return runQuery({ filters, sort, page, pageSize }, {
    schema: transactionsPageArgs,
    run: (input, user) => transactionsReader.page(user.familyId, input.filters, input.sort, input.page, input.pageSize),
    whenInvalid: NO_ROWS,
  });
}

export async function confirmTransferPairAction(formData: FormData) {
  return runFormAction(formData, {
    schema: confirmTransferPairForm,
    run: (input, user) => resolveTransferSuggestionUseCase.confirmPair(user.familyId, input.outflowId, input.inflowId, input.kind),
    revalidate: REVALIDATE.transferReview,
    tolerate: [InvalidTransferReviewError],
  });
}

export async function dismissTransferPairAction(formData: FormData) {
  return runFormAction(formData, {
    schema: dismissTransferPairForm,
    run: (input, user) => resolveTransferSuggestionUseCase.dismissPair(user.familyId, input.outflowId, input.inflowId),
    revalidate: REVALIDATE.transferReview,
    tolerate: [InvalidTransferReviewError],
  });
}

export async function confirmCaptureAction(formData: FormData) {
  return runFormAction(formData, {
    schema: confirmCaptureForm,
    owns: [ownsTransaction((input) => input.transactionId), ownsCategory((input) => input.categoryId)],
    run: (input, user) => confirmCaptureUseCase.execute(user.familyId, input.transactionId, input.categoryId),
    revalidate: REVALIDATE.captureReview,
    tolerate: [InvalidCaptureError],
  });
}

export async function confirmTransferSingleAction(formData: FormData) {
  return runFormAction(formData, {
    schema: confirmTransferSingleForm,
    run: (input, user) => resolveTransferSuggestionUseCase.confirmSingle(user.familyId, input.transactionId, input.kind),
    revalidate: REVALIDATE.transferReview,
    tolerate: [InvalidTransferReviewError],
  });
}

export async function dismissTransferSingleAction(formData: FormData) {
  return runFormAction(formData, {
    schema: transactionIdForm,
    run: (input, user) => resolveTransferSuggestionUseCase.dismissSingle(user.familyId, input.transactionId),
    revalidate: REVALIDATE.transferReview,
    tolerate: [InvalidTransferReviewError],
  });
}

export async function undoTransferAction(formData: FormData) {
  return runFormAction(formData, {
    schema: transactionIdForm,
    run: (input, user) => resolveTransferSuggestionUseCase.undoConfirmed(user.familyId, input.transactionId),
    revalidate: REVALIDATE.transferReview,
    tolerate: [InvalidTransferReviewError],
  });
}
