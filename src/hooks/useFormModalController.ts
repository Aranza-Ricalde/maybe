import type { FormAction } from "@/lib/actionResult";
import { withFeedback } from "@/services/actionFeedback";
import { useState, useTransition, type FormEvent } from "react";

export interface UseFormModalControllerOptions {
  action: FormAction;
}

export interface UseFormModalControllerResult {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isPending: boolean;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function useFormModalController({ action }: UseFormModalControllerOptions): UseFormModalControllerResult {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (await withFeedback(action)(formData)) setIsOpen(false);
    });
  }

  return { isOpen, setIsOpen, isPending, handleSubmit };
}
