"use server";

import { runFormAction } from "@/app/lib/actionRunner";
import { requireUser } from "@/app/lib/dal";
import { ownsCategory, ownsPayPeriod } from "@/app/lib/ownership";
import { REVALIDATE, revalidateRoutes } from "@/app/lib/revalidation";
import { InvalidPayPeriodError } from "@/application/createPayPeriod";
import { DEFAULT_CATEGORY_ICON, InvalidCategoryError } from "@/domain/categories/rules";
import { createCategoryUseCase, issueApiTokenUseCase, createPayPeriodUseCase, deleteCategoryUseCase, deletePayPeriodUseCase, setPeriodViewUseCase, updateCategoryUseCase, updatePayMonthUseCase, updatePayPeriodUseCase } from "@/infrastructure/container";
import { categoryForm, categoryUpdateForm, idForm, periodForm, periodUpdateForm, periodViewForm } from "@/lib/schemas";

export async function createCategory(formData: FormData) {
  return runFormAction(formData, {
    schema: categoryForm,
    owns: [ownsCategory((input) => input.parentId)],
    run: (input, user) => createCategoryUseCase.execute({ familyId: user.familyId, icon: DEFAULT_CATEGORY_ICON, ...input }),
    revalidate: REVALIDATE.categories,
    tolerate: [InvalidCategoryError],
  });
}

export async function updateCategory(formData: FormData) {
  return runFormAction(formData, {
    schema: categoryUpdateForm,
    owns: [ownsCategory((input) => input.id), ownsCategory((input) => input.parentId)],
    run: (input) => updateCategoryUseCase.execute(input),
    revalidate: REVALIDATE.categories,
    tolerate: [InvalidCategoryError],
  });
}

export async function deleteCategory(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsCategory((input) => input.id)],
    run: (input) => deleteCategoryUseCase.execute(input.id),
    revalidate: REVALIDATE.categories,
  });
}

export async function createPeriod(formData: FormData) {
  return runFormAction(formData, {
    schema: periodForm,
    run: (input, user) => createPayPeriodUseCase.execute(user.familyId, input.start, input.end),
    revalidate: REVALIDATE.payPeriods,
    tolerate: [InvalidPayPeriodError],
  });
}

export async function updatePeriod(formData: FormData) {
  return runFormAction(formData, {
    schema: periodUpdateForm,
    owns: [ownsPayPeriod((input) => input.id)],
    run: (input) => updatePayPeriodUseCase.execute(input.id, input.start, input.end),
    revalidate: REVALIDATE.payPeriods,
    tolerate: [InvalidPayPeriodError],
  });
}

export async function updatePayMonth(formData: FormData) {
  return runFormAction(formData, {
    schema: periodUpdateForm,
    owns: [ownsPayPeriod((input) => input.id)],
    run: (input, user) => updatePayMonthUseCase.execute(user.familyId, input.id, input.start, input.end),
    revalidate: REVALIDATE.payPeriods,
    tolerate: [InvalidPayPeriodError],
  });
}

export async function setPeriodView(formData: FormData) {
  return runFormAction(formData, {
    schema: periodViewForm,
    run: (input, user) => setPeriodViewUseCase.execute(user.familyId, input.view),
    revalidate: REVALIDATE.periodView,
  });
}

export async function deletePeriod(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    owns: [ownsPayPeriod((input) => input.id)],
    run: (input) => deletePayPeriodUseCase.execute(input.id),
    revalidate: REVALIDATE.payPeriods,
  });
}

export async function generateApiTokenAction() {
  const user = await requireUser();
  const token = await issueApiTokenUseCase.execute(user.familyId);
  revalidateRoutes(REVALIDATE.settingsOnly);
  return { token };
}
