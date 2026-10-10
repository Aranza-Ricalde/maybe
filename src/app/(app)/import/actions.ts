"use server";

import { runFormAction } from "@/app/lib/actionRunner";
import { REVALIDATE } from "@/app/lib/revalidation";
import { statementInbox } from "@/infrastructure/container";
import { idForm } from "@/lib/schemas";

export async function dismissStatementInbox(formData: FormData) {
  return runFormAction(formData, {
    schema: idForm,
    run: (input, user) => statementInbox.dismiss(user.familyId, input.id),
    success: "Estado descartado",
    revalidate: REVALIDATE.statementImport,
  });
}
