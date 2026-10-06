import { Button } from "@heroui/react";
import type { BudgetPolicy } from "@/domain/recurring/budgetInclusion";

export function RecurringBudgetPolicyNote({ policy, resetAction }: { policy: BudgetPolicy; resetAction: () => void }) {
  if (policy === "ask") return null;
  return (
    <form action={resetAction} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      <span>
        Los recurrentes nuevos {policy === "always_include" ? "cuentan" : "no cuentan"} en tu presupuesto sin preguntarte.
      </span>
      <Button type="submit" size="sm" variant="ghost">
        Volver a preguntar
      </Button>
    </form>
  );
}
