"use client";

import type { FormAction } from "@/lib/actionResult";
import { useFeedbackAction } from "@/hooks/useFeedbackAction";
import { Text } from "@/components/atoms/Text";
import { Switch } from "@/components/ui/switch";
import { buildSwitchFormData } from "@/lib/presenters/switchForm";

export interface FormSwitchProps {
  isSelected: boolean;
  fields: Record<string, string | number>;
  stateField: { name: string; onValue: string; offValue: string };
  action: FormAction;
  ariaLabel: string;
  label: string;
}

export function FormSwitch({ isSelected, fields, stateField, action, ariaLabel, label }: FormSwitchProps) {
  const { isPending, run } = useFeedbackAction(action);

  function handleChange(nextSelected: boolean) {
    run(buildSwitchFormData({ fields, stateField }, nextSelected));
  }

  return (
    <div className="flex items-center gap-2">
      <Switch size="sm" checked={isSelected} disabled={isPending} onCheckedChange={handleChange} aria-label={ariaLabel} />
      <Text size="xs" tone="muted">
        {label}
      </Text>
    </div>
  );
}
