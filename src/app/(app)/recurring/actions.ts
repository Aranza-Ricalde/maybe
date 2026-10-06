"use server";

import { runFormAction } from "@/app/lib/actionRunner";
import { ownsAccount, ownsCategory, ownsRecurringCandidate, ownsRecurringItem } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import { requireUser } from "@/app/lib/dal";
import { InvalidBudgetDecisionError } from "@/domain/recurring/budgetInclusion";
import { dayOfMonthOf } from "@/domain/payPeriod/rules";
import {
  acceptRecurringCandidateUseCase,
  createRecurringItemUseCase,
  decideRecurringBudgetUseCase,
  deleteRecurringItemUseCase,
  dismissRecurringCandidateUseCase,
  resetRecurringBudgetPolicyUseCase,
  toggleRecurringItemStatusUseCase,
  updateRecurringItemUseCase,
} from "@/infrastructure/container";
import { decideRecurringBudgetForm, idForm, recurringItemForm, recurringItemUpdateForm, toggleRecurringForm } from "@/lib/schemas";
import { revalidateRoutes } from "@/app/lib/revalidation";
import { todayIso } from "@/lib/today";

export async function createRecurringItem(formData: FormData) {
  return runFormAction(formData, {
    schema: recurringItemForm,
    owns: [ownsCategory((input) => input.categoryId), ownsAccount((input) => input.accountId)],
    run: (input, user) => createRecurringItemUseCase.execute({ familyId: user.familyId, ...input }),
    revalidate: REVALIDATE.recurring,
  });
}

export async function updateRecurringItem(formData: FormData) {
  return runFormAction(formData, {
    schema: recurringItemUpdateForm,
    owns: [ownsRecurringItem((input) => input.id), ownsCategory((input) => input.categoryId), ownsAccount((input) => input.accountId)],
    run: (input) => updateRecurringItemUseCase.execute(input),
    revalidate: REVALIDATE.recurring,
  });
}

export async function deleteRecurringItem(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsRecurringItem((input) => input.id)],
    run: (input) => deleteRecurringItemUseCase.execute(input.id),
    revalidate: REVALIDATE.recurring,
  });
}

export async function acceptCandidate(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsRecurringCandidate((input) => input.id)],
    run: (input) => acceptRecurringCandidateUseCase.execute(input.id, dayOfMonthOf(todayIso())),
    revalidate: REVALIDATE.recurring,
  });
}

export async function dismissCandidate(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsRecurringCandidate((input) => input.id)],
    run: (input) => dismissRecurringCandidateUseCase.execute(input.id),
    revalidate: REVALIDATE.recurring,
  });
}

export async function toggleRecurringItem(formData: FormData) {
  return runFormAction(formData, {
    schema: toggleRecurringForm,
    owns: [ownsRecurringItem((input) => input.id)],
    run: (input) => toggleRecurringItemStatusUseCase.execute(input.id, input.nextStatus === "active" ? "active" : "paused"),
    revalidate: REVALIDATE.recurring,
  });
}

export async function decideRecurringBudget(formData: FormData) {
  return runFormAction(formData, {
    schema: decideRecurringBudgetForm,
    run: (input, user) =>
      decideRecurringBudgetUseCase.execute({
        familyId: user.familyId,
        recurringItemId: input.recurringItemId,
        decision: input.decision,
        rememberForAll: input.rememberForAll,
      }),
    revalidate: REVALIDATE.recurringBudget,
    tolerate: [InvalidBudgetDecisionError],
  });
}

export async function resetRecurringBudgetPolicy() {
  const user = await requireUser();
  await resetRecurringBudgetPolicyUseCase.execute(user.familyId);
  revalidateRoutes(REVALIDATE.recurringPolicy);
}
