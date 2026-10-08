import { useState } from "react";
import type { FormAction } from "@/lib/actionResult";

export function useRefreshSignal() {
  const [signal, setSignal] = useState(0);
  return {
    signal,
    withRefresh: (action: FormAction): FormAction => async (formData) => {
      const result = await action(formData);
      setSignal((current) => current + 1);
      return result;
    },
  };
}
