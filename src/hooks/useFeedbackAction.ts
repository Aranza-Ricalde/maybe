import { useTransition } from "react";
import type { FormAction } from "@/lib/actionResult";
import { withFeedback } from "@/services/actionFeedback";

export function useFeedbackAction(action: FormAction) {
  const [isPending, startTransition] = useTransition();
  return {
    isPending,
    run: (formData: FormData) =>
      startTransition(async () => {
        await withFeedback(action)(formData);
      }),
  };
}
