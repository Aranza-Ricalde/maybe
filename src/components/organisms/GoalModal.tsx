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
  action: (formData: FormData) => Promise<void> | void;
}

export function GoalModal({ mode, initialValues, accounts, action }: GoalModalProps) {
  return (
    <EntityFormModal mode={mode} labels={ENTITY.goal} entityId={initialValues?.id}
      action={action}
    >
      <TextInput label="Nombre" name={FIELD.name} defaultValue={initialValues?.name} isRequired />
      <TextInput
        label="Monto objetivo"
        name={FIELD.targetAmount}
        type="number"
        step="0.01"
        defaultValue={initialValues ? String(initialValues.targetAmountCents / 100) : undefined}
        isRequired
      />
      <TextInput label="Fecha objetivo (opcional)" name={FIELD.targetDate} type="date" defaultValue={initialValues?.targetDate ?? undefined} />
      <AccountMultiSelect
        label="Cuentas vinculadas (opcional)"
        name={FIELD.accountIds}
        options={accounts}
        defaultValue={initialValues?.linkedAccountIds ?? []}
      />
    </EntityFormModal>
  );
}
