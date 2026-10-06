"use server";

import { runFormAction } from "@/app/lib/actionRunner";
import { ownsCategory } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import { deleteBudgetLineUseCase, setBudgetLineUseCase } from "@/infrastructure/container";
import { budgetLineForm, categoryIdForm } from "@/lib/schemas";

export async function setBudgetLine(formData: FormData) {
  return runFormAction(formData, {
    schema: budgetLineForm,
    owns: [ownsCategory((input) => input.categoryId)],
    run: (input, user) => setBudgetLineUseCase.execute({ familyId: user.familyId, ...input }),
    revalidate: REVALIDATE.budgetLines,
  });
}

export async function deleteBudgetLine(formData: FormData) {
  return runFormAction(formData, {
    schema: categoryIdForm,
    owns: [ownsCategory((input) => input.categoryId)],
    run: (input, user) => deleteBudgetLineUseCase.execute(user.familyId, input.categoryId),
    revalidate: REVALIDATE.budgetLines,
  });
}
