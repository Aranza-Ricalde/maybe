"use server";

import { runFormAction, runQuery } from "@/app/lib/actionRunner";
import { ownsAccount, ownsCategory, ownsConceptSuggestion } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import { InvalidExplorerFiltersError, type ExplorerResult } from "@/domain/explorer/rules";
import { InvalidOccurrenceDecisionError, assertValidOccurrenceDecision } from "@/domain/recurring/occurrences";
import { InvalidOccurrenceLinkError } from "@/domain/recurring/paymentCandidates";
import {
  confirmConceptSuggestionUseCase,
  getExplorerUseCase,
  linkOccurrenceTransactionUseCase,
  listOccurrencePaymentCandidatesUseCase,
  rejectConceptSuggestionUseCase,
  resolveRecurringOccurrenceUseCase,
} from "@/infrastructure/container";
import { explorerArgs, idForm, linkPaymentForm, occurrenceArgs, occurrenceDecisionForm } from "@/lib/schemas";
import { todayIso } from "@/lib/today";

export async function confirmConceptSuggestionAction(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsConceptSuggestion((input) => input.id)],
    run: (input) => confirmConceptSuggestionUseCase.execute(input.id),
    success: "Comercio confirmado",
    revalidate: REVALIDATE.conceptConfirmed,
  });
}

export async function rejectConceptSuggestionAction(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsConceptSuggestion((input) => input.id)],
    run: (input) => rejectConceptSuggestionUseCase.execute(input.id),
    success: "Sugerencia descartada",
    revalidate: REVALIDATE.dashboard,
  });
}

export async function resolveOccurrenceAction(formData: FormData) {
  return runFormAction(formData, {
    schema: occurrenceDecisionForm,
    run: (input, user) => {
      assertValidOccurrenceDecision(input.decision);
      return resolveRecurringOccurrenceUseCase.execute(user.familyId, input.occurrenceId, input.decision);
    },
    success: (input) => ({ mark_paid: "Marcado como pagado", skip: "Omitido en este periodo", reopen: "Restaurado" })[String(input.decision)] ?? "Actualizado",
    revalidate: REVALIDATE.dashboard,
    tolerate: [InvalidOccurrenceDecisionError],
  });
}

export async function linkPaymentAction(formData: FormData) {
  return runFormAction(formData, {
    schema: linkPaymentForm,
    run: (input, user) => linkOccurrenceTransactionUseCase.execute(user.familyId, input.occurrenceId, input.transactionId),
    success: "Pago vinculado al movimiento",
    revalidate: REVALIDATE.dashboard,
    tolerate: [InvalidOccurrenceLinkError],
  });
}

export async function listPaymentCandidatesAction(occurrenceId: number) {
  return runQuery({ occurrenceId }, {
    schema: occurrenceArgs,
    run: async (input, user) => {
      try {
        return await listOccurrencePaymentCandidatesUseCase.execute(user.familyId, input.occurrenceId);
      } catch (error) {
        if (error instanceof InvalidOccurrenceLinkError) return [];
        throw error;
      }
    },
    whenInvalid: [],
  });
}

export async function loadExplorerAction(args: unknown): Promise<ExplorerResult | null> {
  return runQuery(args, {
    schema: explorerArgs,
    owns: [ownsAccount((input) => input.accountId), ownsCategory((input) => input.categoryId)],
    run: async (input, user) => {
      try {
        return await getExplorerUseCase.execute(user.familyId, input, todayIso());
      } catch (error) {
        if (error instanceof InvalidExplorerFiltersError) return null;
        throw error;
      }
    },
    whenInvalid: null,
  });
}
