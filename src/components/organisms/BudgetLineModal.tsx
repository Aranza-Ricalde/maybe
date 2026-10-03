import { Pencil } from "@gravity-ui/icons";
import { Icon } from "@/components/atoms/Icon";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";
import type { BudgetCadence } from "@/domain/budget/rules";
import { BUDGET_CADENCE_OPTIONS } from "@/lib/format";

export interface BudgetLineModalProps {
  categoryId: number;
  categoryName: string;
  cadence: BudgetCadence;
  budgetedAmountCents: number;
  action: (formData: FormData) => Promise<void> | void;
}

const TRIGGER_CLASSNAME =
  "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground";

export function BudgetLineModal({ categoryId, categoryName, cadence, budgetedAmountCents, action }: BudgetLineModalProps) {
  return (
    <FormModal
      title={`Presupuesto — ${categoryName}`}
      trigger={<Icon icon={Pencil} />}
      triggerVariant="ghost"
      triggerIsIconOnly
      triggerAriaLabel={`Editar presupuesto de ${categoryName}`}
      triggerClassName={TRIGGER_CLASSNAME}
      submitLabel="Guardar"
      size="sm"
      action={action}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <SelectField label="Cadencia" name="cadence" defaultValue={cadence} options={BUDGET_CADENCE_OPTIONS} />
      <TextInput
        label="Monto presupuestado"
        name="amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        defaultValue={budgetedAmountCents > 0 ? String(budgetedAmountCents / 100) : undefined}
        isRequired
      />
    </FormModal>
  );
}
