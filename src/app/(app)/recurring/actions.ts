"use server";

import { runFormAction, runUserAction } from "@/app/lib/actionRunner";
import { ownsAccount, ownsCategory, ownsRecurringCandidate, ownsRecurringItem } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import { InvalidBudgetDecisionError } from "@/domain/recurring/budgetInclusion";
import { dayOfMonthOf } from "@/domain/payPeriod/rules";
import {
  acceptRecurringCandidateUseCase,
  createRecurringItemUseCase,
  decideRecurringBudgetUseCase,
  deleteRecurringItemUseCase,
  dismissRecurringCandidateUseCase,
  resetRecurringBudgetPolicyUseCase,
  savePayrollUseCase,
  toggleRecurringItemStatusUseCase,
  updateRecurringItemUseCase,
} from "@/infrastructure/container";
import { decideRecurringBudgetForm, payrollForm, idForm, recurringItemForm, recurringItemUpdateForm, toggleRecurringForm } from "@/lib/schemas";
import { todayIso } from "@/lib/today";

export async function createRecurringItem(formData: FormData) {
  return runFormAction(formData, {
    schema: recurringItemForm,
    owns: [ownsCategory((input) => input.categoryId), ownsAccount((input) => input.accountId)],
    run: (input, user) => createRecurringItemUseCase.execute({ familyId: user.familyId, ...input }),
    success: "Recurrente creado",
    revalidate: REVALIDATE.recurring,
  });
}

export async function updateRecurringItem(formData: FormData) {
  return runFormAction(formData, {
    schema: recurringItemUpdateForm,
    owns: [ownsRecurringItem((input) => input.id), ownsCategory((input) => input.categoryId), ownsAccount((input) => input.accountId)],
    run: (input) => updateRecurringItemUseCase.execute(input),
    success: "Recurrente actualizado",
    revalidate: REVALIDATE.recurring,
  });
}

export async function deleteRecurringItem(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsRecurringItem((input) => input.id)],
    run: (input) => deleteRecurringItemUseCase.execute(input.id),
    success: "Recurrente eliminado",
    revalidate: REVALIDATE.recurring,
  });
}

export async function acceptCandidate(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsRecurringCandidate((input) => input.id)],
    run: (input) => acceptRecurringCandidateUseCase.execute(input.id, dayOfMonthOf(todayIso())),
    success: "Recurrente confirmado",
    revalidate: REVALIDATE.recurring,
  });
}

export async function dismissCandidate(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsRecurringCandidate((input) => input.id)],
    run: (input) => dismissRecurringCandidateUseCase.execute(input.id),
    success: "Sugerencia descartada",
    revalidate: REVALIDATE.recurring,
  });
}

export async function toggleRecurringItem(formData: FormData) {
  return runFormAction(formData, {
    schema: toggleRecurringForm,
    owns: [ownsRecurringItem((input) => input.id)],
    run: (input) => toggleRecurringItemStatusUseCase.execute(input.id, input.nextStatus === "active" ? "active" : "paused"),
    success: (input) => (input.nextStatus === "active" ? "Recurrente activado" : "Recurrente pausado"),
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
    success: "Decisión guardada",
    revalidate: REVALIDATE.recurringBudget,
    tolerate: [InvalidBudgetDecisionError],
  });
}

export async function resetRecurringBudgetPolicy() {
  return runUserAction({
    run: (user) => resetRecurringBudgetPolicyUseCase.execute(user.familyId),
    success: "Te volveremos a preguntar por los recurrentes nuevos",
    revalidate: REVALIDATE.recurringPolicy,
  });
}

export async function savePayroll(formData: FormData) {
  return runFormAction(formData, {
    schema: payrollForm,
    owns: [ownsAccount((input) => input.accountId), ownsCategory((input) => input.categoryId)],
    run: (input, user) => savePayrollUseCase.execute({ familyId: user.familyId, ...input, today: todayIso() }),
    success: "Nómina guardada",
    revalidate: REVALIDATE.recurring,
  });
}
