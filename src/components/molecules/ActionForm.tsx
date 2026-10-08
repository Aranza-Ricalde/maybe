"use client";

import type { ComponentProps } from "react";
import type { FormAction } from "@/lib/actionResult";
import { withFeedback } from "@/services/actionFeedback";

export interface ActionFormProps extends Omit<ComponentProps<"form">, "action"> {
  action: FormAction;
}

export function ActionForm({ action, ...props }: ActionFormProps) {
  const submit = withFeedback(action);
  return <form action={async (formData) => void (await submit(formData))} {...props} />;
}
