"use client";

import { Button } from "@heroui/react";
import { useTransition } from "react";

export interface RestoreAccountButtonProps {
  accountId: number;
  restoreAccountAction: (formData: FormData) => Promise<void> | void;
}

export function RestoreAccountButton({ accountId, restoreAccountAction }: RestoreAccountButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handlePress() {
    const formData = new FormData();
    formData.set("accountId", String(accountId));
    startTransition(async () => {
      await restoreAccountAction(formData);
    });
  }

  return (
    <Button type="button" size="sm" variant="secondary" isDisabled={isPending} onPress={handlePress}>
      {isPending ? "Reactivando…" : "Reactivar"}
    </Button>
  );
}
