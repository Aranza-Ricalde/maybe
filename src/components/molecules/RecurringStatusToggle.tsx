"use client";

import { Switch } from "@heroui/react";
import { useTransition } from "react";
import { Text } from "@/components/atoms/Text";

export interface RecurringStatusToggleProps {
  itemId: number;
  isActive: boolean;
  toggleAction: (formData: FormData) => Promise<void> | void;
}

export function RecurringStatusToggle({ itemId, isActive, toggleAction }: RecurringStatusToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(nextSelected: boolean) {
    const formData = new FormData();
    formData.set("id", String(itemId));
    formData.set("nextStatus", nextSelected ? "active" : "paused");
    startTransition(async () => {
      await toggleAction(formData);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch size="sm" isSelected={isActive} isDisabled={isPending} onChange={handleChange} aria-label={isActive ? "Pausar recurrente" : "Reactivar recurrente"}>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
      <Text size="xs" tone="muted">
        {isActive ? "Activo" : "Pausado"}
      </Text>
    </div>
  );
}
