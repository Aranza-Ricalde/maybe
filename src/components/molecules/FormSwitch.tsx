"use client";

import { Switch } from "@heroui/react";
import { useTransition } from "react";
import { Text } from "@/components/atoms/Text";

export interface FormSwitchProps {
  isSelected: boolean;
  fields: Record<string, string | number>;
  stateField: { name: string; onValue: string; offValue: string };
  action: (formData: FormData) => Promise<void> | void;
  ariaLabel: string;
  label: string;
}

export function FormSwitch({ isSelected, fields, stateField, action, ariaLabel, label }: FormSwitchProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(nextSelected: boolean) {
    const formData = new FormData();
    for (const [name, value] of Object.entries(fields)) formData.set(name, String(value));
    formData.set(stateField.name, nextSelected ? stateField.onValue : stateField.offValue);
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch size="sm" isSelected={isSelected} isDisabled={isPending} onChange={handleChange} aria-label={ariaLabel}>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
      <Text size="xs" tone="muted">
        {label}
      </Text>
    </div>
  );
}
