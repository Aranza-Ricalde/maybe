import { Pencil } from "@gravity-ui/icons";
import { Icon } from "@/components/atoms/Icon";
import { AccountMultiSelect } from "@/components/molecules/AccountMultiSelect";
import { TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";

export interface GoalAccountOption {
  id: number;
  name: string;
}

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
  accounts: GoalAccountOption[];
  action: (formData: FormData) => Promise<void> | void;
}

const EDIT_TRIGGER_CLASSNAME =
  "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground";

export function GoalModal({ mode, initialValues, accounts, action }: GoalModalProps) {
  const isEdit = mode === "edit";

  return (
    <FormModal
      title={isEdit ? "Editar meta" : "Nueva meta"}
      trigger={isEdit ? <Icon icon={Pencil} /> : "+ Nueva meta"}
      triggerVariant={isEdit ? "ghost" : "primary"}
      triggerIsIconOnly={isEdit}
      triggerAriaLabel={isEdit ? "Editar meta" : undefined}
      triggerClassName={isEdit ? EDIT_TRIGGER_CLASSNAME : undefined}
      submitLabel={isEdit ? "Guardar cambios" : "Crear meta"}
      action={action}
    >
      {isEdit && initialValues?.id != null && <input type="hidden" name="id" value={initialValues.id} />}
      <TextInput label="Nombre" name="name" defaultValue={initialValues?.name} isRequired />
      <TextInput
        label="Monto objetivo"
        name="targetAmount"
        type="number"
        step="0.01"
        defaultValue={initialValues ? String(initialValues.targetAmountCents / 100) : undefined}
        isRequired
      />
      <TextInput label="Fecha objetivo (opcional)" name="targetDate" type="date" defaultValue={initialValues?.targetDate ?? undefined} />
      <AccountMultiSelect
        label="Cuentas vinculadas (opcional)"
        name="accountIds"
        options={accounts}
        defaultValue={initialValues?.linkedAccountIds ?? []}
      />
    </FormModal>
  );
}
