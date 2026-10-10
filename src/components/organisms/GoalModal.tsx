import type { FormAction } from "@/lib/actionResult";
import { AccountMultiSelect } from "@/components/molecules/AccountMultiSelect";
import { TextInput } from "@/components/molecules/FormField";
import { ENTITY } from "@/lib/entityLabels";
import { EntityFormModal } from "./EntityFormModal";
import { FIELD } from "@/lib/formFields";
import type { AccountOption } from "@/components/viewModels";

export interface GoalFormValues {
  id?: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  linkedAccountIds: number[];
}

export interface GoalModalProps {
  mode: "create" | "edit";
  initialValues?: GoalFormValues;
  accounts: AccountOption[];
  action: FormAction;
}

export function GoalModal({ mode, initialValues, accounts, action }: GoalModalProps) {
  return (
    <EntityFormModal mode={mode} labels={ENTITY.goal} entityId={initialValues?.id}
      action={action}
    >
      <TextInput label="Nombre" name={FIELD.name} defaultValue={initialValues?.name} placeholder="Ej.: Vacaciones, Fondo de emergencia" isRequired />
      <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
        <TextInput
          label="Monto objetivo"
          prefix="$"
          name={FIELD.targetAmount}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          defaultValue={initialValues ? String(initialValues.targetAmountCents / 100) : undefined}
          isRequired
        />
        <TextInput label="Fecha objetivo" description="Opcional." name={FIELD.targetDate} type="date" defaultValue={initialValues?.targetDate ?? undefined} />
      </div>
      <AccountMultiSelect
        label="Cuentas vinculadas"
        description="Opcional. Su saldo cuenta como avance de la meta."
        name={FIELD.accountIds}
        options={accounts}
        defaultValue={initialValues?.linkedAccountIds ?? []}
      />
    </EntityFormModal>
  );
}
