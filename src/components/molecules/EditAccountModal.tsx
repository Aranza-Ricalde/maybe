import { Pencil } from "@gravity-ui/icons";
import { Icon } from "@/components/atoms/Icon";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "@/components/organisms/FormModal";
import type { AccountType } from "@/domain/accounts/rules";
import { ACCOUNT_TYPE_OPTIONS } from "@/lib/format";

export interface EditAccountModalProps {
  accountId: number;
  name: string;
  type: AccountType;
  creditLimitCents: number | null;
  updateAccountAction: (formData: FormData) => Promise<void> | void;
}

export function EditAccountModal({ accountId, name, type, creditLimitCents, updateAccountAction }: EditAccountModalProps) {
  return (
    <FormModal
      title="Editar cuenta"
      trigger={<Icon icon={Pencil} />}
      triggerVariant="ghost"
      triggerIsIconOnly
      triggerAriaLabel="Editar cuenta"
      submitLabel="Guardar cambios"
      action={updateAccountAction}
    >
      <input type="hidden" name="accountId" value={accountId} />
      <TextInput label="Nombre" name="name" defaultValue={name} isRequired />
      <SelectField label="Tipo" name="type" defaultValue={type} options={ACCOUNT_TYPE_OPTIONS} />
      <TextInput
        label="Límite de crédito (solo tarjetas, opcional)"
        name="creditLimitCents"
        type="number"
        step="0.01"
        defaultValue={creditLimitCents != null ? (creditLimitCents / 100).toFixed(2) : undefined}
      />
    </FormModal>
  );
}
