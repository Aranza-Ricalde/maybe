"use client";

import { FormSwitch } from "./FormSwitch";
import { FIELD } from "@/lib/formFields";

export interface RecurringBudgetInclusionCellProps {
  itemId: number;
  isRelevant: boolean;
  budgetInclusion: "included" | "excluded" | null;
  action: (formData: FormData) => Promise<void> | void;
}

export function RecurringBudgetInclusionCell({ itemId, isRelevant, budgetInclusion, action }: RecurringBudgetInclusionCellProps) {
  if (!isRelevant) return <span className="text-xs text-muted">—</span>;
  const counts = budgetInclusion !== "excluded";

  return (
    <FormSwitch
      isSelected={counts}
      fields={{ recurringItemId: itemId }}
      stateField={{ name: FIELD.decision, onValue: "include", offValue: "exclude" }}
      action={action}
      ariaLabel={counts ? "Sacar del presupuesto" : "Incluir en el presupuesto"}
      label={budgetInclusion == null ? "Cuenta (sin decidir)" : counts ? "Cuenta" : "No cuenta"}
    />
  );
}
