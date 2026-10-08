import type { FormAction } from "@/lib/actionResult";
import { Pencil } from "lucide-react";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";
import type { BudgetCadence } from "@/domain/budget/rules";
import { BUDGET_CADENCE_OPTIONS } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

export interface BudgetLineModalProps {
  categoryId: number;
  categoryName: string;
  cadence: BudgetCadence;
  budgetedAmountCents: number;
  action: FormAction;
}

export function BudgetLineModal({ categoryId, categoryName, cadence, budgetedAmountCents, action }: BudgetLineModalProps) {
  return (
    <FormModal
      title={`Presupuesto — ${categoryName}`}
      iconTrigger={{ icon: Pencil, label: `Editar presupuesto de ${categoryName}` }}
      submitLabel="Guardar"
      size="sm"
      action={action}
    >
      <input type="hidden" name={FIELD.categoryId} value={categoryId} />
      <SelectField label="Cadencia" description="Cada cuánto se repite este presupuesto." name={FIELD.cadence} defaultValue={cadence} options={BUDGET_CADENCE_OPTIONS} />
      <TextInput
        label="Monto presupuestado"
        prefix="$"
        name={FIELD.amount}
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        defaultValue={budgetedAmountCents > 0 ? String(budgetedAmountCents / 100) : undefined}
        isRequired
      />
    </FormModal>
  );
}
