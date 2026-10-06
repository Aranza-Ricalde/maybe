"use server";

import { runFormAction, runQuery } from "@/app/lib/actionRunner";
import { ownsConceptSuggestion } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import type { EvolutionMetric, EvolutionRangeKey } from "@/domain/evolution/rules";
import { InvalidOccurrenceDecisionError, assertValidOccurrenceDecision } from "@/domain/recurring/occurrences";
import { InvalidOccurrenceLinkError } from "@/domain/recurring/paymentCandidates";
import {
  confirmConceptSuggestionUseCase,
  getFinancialEvolutionUseCase,
  linkOccurrenceTransactionUseCase,
  listOccurrencePaymentCandidatesUseCase,
  rejectConceptSuggestionUseCase,
  resolveRecurringOccurrenceUseCase,
} from "@/infrastructure/container";
import { evolutionSeriesArgs, idForm, linkPaymentForm, occurrenceArgs, occurrenceDecisionForm } from "@/lib/schemas";
import { todayIso } from "@/lib/today";

export async function confirmConceptSuggestionAction(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsConceptSuggestion((input) => input.id)],
    run: (input) => confirmConceptSuggestionUseCase.execute(input.id),
    revalidate: REVALIDATE.conceptConfirmed,
  });
}

export async function rejectConceptSuggestionAction(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsConceptSuggestion((input) => input.id)],
    run: (input) => rejectConceptSuggestionUseCase.execute(input.id),
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
    revalidate: REVALIDATE.dashboard,
    tolerate: [InvalidOccurrenceDecisionError],
  });
}

export async function linkPaymentAction(formData: FormData) {
  return runFormAction(formData, {
    schema: linkPaymentForm,
    run: (input, user) => linkOccurrenceTransactionUseCase.execute(user.familyId, input.occurrenceId, input.transactionId),
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

export async function loadEvolutionSeriesAction(metric: EvolutionMetric, range: EvolutionRangeKey) {
  return runQuery({ metric, range }, {
    schema: evolutionSeriesArgs,
    run: (input, user) => getFinancialEvolutionUseCase.execute(user.familyId, input.metric, input.range, todayIso()),
    whenInvalid: [],
  });
}
