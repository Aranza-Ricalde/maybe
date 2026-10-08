import { ActionForm } from "@/components/molecules/ActionForm";
import { Button } from "@/components/ui/button";
import type { BudgetPolicy } from "@/domain/recurring/budgetInclusion";

export function RecurringBudgetPolicyNote({ policy, resetAction }: { policy: BudgetPolicy; resetAction: () => void }) {
  if (policy === "ask") return null;
  return (
    <ActionForm action={resetAction} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>
        Los recurrentes nuevos {policy === "always_include" ? "se usan" : "no se usan"} como presupuesto de su categoría sin preguntarte.
      </span>
      <Button type="submit" size="sm" variant="ghost">
        Volver a preguntar
      </Button>
    </ActionForm>
  );
}
