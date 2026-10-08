"use client";

import type { FormAction } from "@/lib/actionResult";
import { Button } from "@/components/ui/button";
import { useFeedbackAction } from "@/hooks/useFeedbackAction";

export interface RestoreAccountButtonProps {
  accountId: number;
  restoreAccountAction: FormAction;
}

export function RestoreAccountButton({ accountId, restoreAccountAction }: RestoreAccountButtonProps) {
  const { isPending, run } = useFeedbackAction(restoreAccountAction);

  function handlePress() {
    const formData = new FormData();
    formData.set("accountId", String(accountId));
    run(formData);
  }

  return (
    <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={handlePress}>
      {isPending ? "Reactivando…" : "Reactivar"}
    </Button>
  );
}
