"use server";

import { runFormAction } from "@/app/lib/actionRunner";
import { REVALIDATE } from "@/app/lib/revalidation";
import { InvalidSettingError } from "@/domain/settings/rules";
import { pesosToCents } from "@/domain/shared/money";
import { setMinimumBalanceUseCase } from "@/infrastructure/container";
import { minimumBalanceForm } from "@/lib/schemas";

export async function setMinimumBalance(formData: FormData) {
  return runFormAction(formData, {
    schema: minimumBalanceForm,
    run: (input, user) => setMinimumBalanceUseCase.execute(user.familyId, pesosToCents(input.minimum)),
    revalidate: REVALIDATE.projection,
    tolerate: [InvalidSettingError],
  });
}
