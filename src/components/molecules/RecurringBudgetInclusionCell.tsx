"use client";

import type { FormAction } from "@/lib/actionResult";
import { FormSwitch } from "./FormSwitch";
import { FIELD } from "@/lib/formFields";

export interface RecurringBudgetInclusionCellProps {
  itemId: number;
  isRelevant: boolean;
  budgetInclusion: "included" | "excluded" | null;
  action: FormAction;
}

export function RecurringBudgetInclusionCell({ itemId, isRelevant, budgetInclusion, action }: RecurringBudgetInclusionCellProps) {
  if (!isRelevant) return <span className="text-xs text-muted-foreground">—</span>;
  const counts = budgetInclusion !== "excluded";

  return (
    <FormSwitch
      isSelected={counts}
      fields={{ recurringItemId: itemId }}
      stateField={{ name: FIELD.decision, onValue: "include", offValue: "exclude" }}
      action={action}
      ariaLabel={counts ? "Dejar de usar como presupuesto de su categoría" : "Usar como presupuesto de su categoría"}
      label={budgetInclusion == null ? "Sin decidir" : counts ? "Sí lo usa" : "No lo usa"}
    />
  );
}
