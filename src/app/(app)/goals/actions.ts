"use server";

import { runFormAction } from "@/app/lib/actionRunner";
import { ownsAccounts, ownsGoal } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import { createGoalUseCase, deleteGoalUseCase, updateGoalUseCase } from "@/infrastructure/container";
import { goalForm, goalUpdateForm, idForm } from "@/lib/schemas";

export async function createGoal(formData: FormData) {
  return runFormAction(formData, {
    schema: goalForm,
    owns: [ownsAccounts((input) => input.accountIds)],
    run: (input, user) => createGoalUseCase.execute({ familyId: user.familyId, ...input }),
    revalidate: REVALIDATE.goals,
  });
}

export async function updateGoal(formData: FormData) {
  return runFormAction(formData, {
    schema: goalUpdateForm,
    owns: [ownsGoal((input) => input.id), ownsAccounts((input) => input.accountIds)],
    run: (input) => updateGoalUseCase.execute(input),
    revalidate: REVALIDATE.goals,
  });
}

export async function deleteGoal(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsGoal((input) => input.id)],
    run: (input) => deleteGoalUseCase.execute(input.id),
    revalidate: REVALIDATE.goals,
  });
}
