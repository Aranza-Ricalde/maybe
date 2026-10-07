"use server";

import { runFormAction } from "@/app/lib/actionRunner";
import { REVALIDATE } from "@/app/lib/revalidation";
import { InvalidSubscriptionMergeError } from "@/domain/spendingAnalysis/subscriptions";
import { mergeSubscriptionsUseCase } from "@/infrastructure/container";
import { idForm, mergeSubscriptionsForm } from "@/lib/schemas";
import { FIELD } from "@/lib/formFields";

export async function mergeSubscriptions(formData: FormData) {
  return runFormAction(formData, {
    schema: mergeSubscriptionsForm,
    run: (input, user) => mergeSubscriptionsUseCase.execute(user.familyId, input[FIELD.members], input[FIELD.name]),
    revalidate: REVALIDATE.spendingOnly,
    tolerate: [InvalidSubscriptionMergeError],
  });
}

export async function dissolveSubscriptionGroup(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    run: (input, user) => mergeSubscriptionsUseCase.dissolve(user.familyId, input.id),
    revalidate: REVALIDATE.spendingOnly,
  });
}
