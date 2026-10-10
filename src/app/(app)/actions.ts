"use server";

import { runFormAction, runQuery, runUserAction } from "@/app/lib/actionRunner";
import { ownsConceptSuggestion } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import { InvalidOccurrenceDecisionError, assertValidOccurrenceDecision } from "@/domain/recurring/occurrences";
import { InvalidOccurrenceLinkError } from "@/domain/recurring/paymentCandidates";
import {
  confirmConceptSuggestionUseCase,
  notificationInbox,
  linkOccurrenceTransactionUseCase,
  listOccurrencePaymentCandidatesUseCase,
  rejectConceptSuggestionUseCase,
  resolveRecurringOccurrenceUseCase,
} from "@/infrastructure/container";
import { idForm, linkPaymentForm, occurrenceArgs, occurrenceDecisionForm } from "@/lib/schemas";

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


export async function markNotificationRead(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    run: (input, user) => notificationInbox.markRead(user.familyId, input.id),
    success: "Notificación marcada como leída",
    revalidate: REVALIDATE.notifications,
  });
}

export async function dismissNotification(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    run: (input, user) => notificationInbox.dismiss(user.familyId, input.id),
    success: "Notificación eliminada",
    revalidate: REVALIDATE.notifications,
  });
}

export async function markAllNotificationsRead() {
  return runUserAction({
    run: (user) => notificationInbox.markAllRead(user.familyId),
    success: "Notificaciones marcadas como leídas",
    revalidate: REVALIDATE.notifications,
  });
}

export async function dismissAllNotifications() {
  return runUserAction({
    run: (user) => notificationInbox.dismissAll(user.familyId),
    success: "Notificaciones eliminadas",
    revalidate: REVALIDATE.notifications,
  });
}
