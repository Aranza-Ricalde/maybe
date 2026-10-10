import type { FormAction } from "@/lib/actionResult";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { ENTITY } from "@/lib/entityLabels";
import { EntityFormModal } from "./EntityFormModal";
import type { Flow } from "@/domain/ledger/rules";
import { FLOW_OPTIONS } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import type { AccountOption, CategoryOption } from "@/components/viewModels";

export interface RecurringItemFormValues {
  id?: number;
  name: string;
  flow: Flow;
  estimatedAmount: number;
  categoryId: number | null;
  accountId: number | null;
  dayOfMonth: number;
}

export interface RecurringItemModalProps {
  mode: "create" | "edit";
  initialValues?: RecurringItemFormValues;
  accounts: AccountOption[];
  categories: CategoryOption[];
  action: FormAction;
}

export function RecurringItemModal({ mode, initialValues, accounts, categories, action }: RecurringItemModalProps) {
  return (
    <EntityFormModal mode={mode} labels={ENTITY.recurringItem} entityId={initialValues?.id}
      action={action}
    >
      <TextInput label="Nombre" name={FIELD.name} defaultValue={initialValues?.name} placeholder="Ej.: Renta, Netflix, Nómina" isRequired />
      <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
        <SelectField label="Tipo" name={FIELD.flow} defaultValue={initialValues?.flow ?? "expense"} options={FLOW_OPTIONS} />
        <TextInput
          label="Día del mes"
          name={FIELD.dayOfMonth}
          type="number"
          min="1"
          max="31"
          defaultValue={String(initialValues?.dayOfMonth ?? 1)}
          isRequired
        />
      </div>
      <TextInput
        label="Monto estimado"
        prefix="$"
        name={FIELD.estimatedAmount}
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        defaultValue={initialValues ? String(Math.abs(initialValues.estimatedAmount)) : undefined}
        isRequired
      />
      <SelectField
        label="Categoría"
        name={FIELD.categoryId}
        defaultValue={initialValues?.categoryId != null ? String(initialValues.categoryId) : ""}
        options={[{ value: "", label: "Sin categoría" }, ...categories.map((c) => ({ value: String(c.id), label: c.label ?? c.name }))]}
      />
      <SelectField
        label="Cuenta habitual"
        description="Opcional. Es solo una referencia: no hace falta para reconocer el pago."
        name={FIELD.accountId}
        defaultValue={initialValues?.accountId != null ? String(initialValues.accountId) : ""}
        options={[{ value: "", label: "Sin cuenta específica" }, ...accounts.map((a) => ({ value: String(a.id), label: a.name }))]}
      />
    </EntityFormModal>
  );
}
