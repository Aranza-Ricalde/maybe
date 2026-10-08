"use client";

import type { FormAction } from "@/lib/actionResult";
import { FormSwitch } from "./FormSwitch";
import { FIELD } from "@/lib/formFields";

export interface RecurringStatusToggleProps {
  itemId: number;
  isActive: boolean;
  toggleAction: FormAction;
}

export function RecurringStatusToggle({ itemId, isActive, toggleAction }: RecurringStatusToggleProps) {
  return (
    <FormSwitch
      isSelected={isActive}
      fields={{ id: itemId }}
      stateField={{ name: FIELD.nextStatus, onValue: "active", offValue: "paused" }}
      action={toggleAction}
      ariaLabel={isActive ? "Pausar recurrente" : "Reactivar recurrente"}
      label={isActive ? "Activo" : "Pausado"}
    />
  );
}
