import type { FormAction } from "@/lib/actionResult";
import { FIELD } from "@/lib/formFields";
import { withFeedback } from "@/services/actionFeedback";
import { useTransition, type FormEvent } from "react";

export function useRowAction(action: FormAction, deleteAction?: FormAction) {
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await withFeedback(action)(formData);
    });
  }

  function remove(categoryId: number) {
    if (!deleteAction) return;
    const formData = new FormData();
    formData.set(FIELD.categoryId, String(categoryId));
    startTransition(async () => {
      await withFeedback(deleteAction)(formData);
    });
  }

  return { isPending, submit, remove };
}
