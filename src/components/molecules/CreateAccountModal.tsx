import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "@/components/organisms/FormModal";
import { ACCOUNT_TYPE_OPTIONS } from "@/lib/format";

export interface CreateAccountModalProps {
  createAccountAction: (formData: FormData) => Promise<void> | void;
}

export function CreateAccountModal({ createAccountAction }: CreateAccountModalProps) {
  return (
    <FormModal title="Nueva cuenta" trigger="+ Nueva cuenta" triggerVariant="primary" submitLabel="Crear cuenta" action={createAccountAction}>
      <TextInput label="Nombre" name="name" isRequired />
      <SelectField label="Tipo" name="type" defaultValue="checking" options={ACCOUNT_TYPE_OPTIONS} />
      <TextInput label="Límite de crédito (solo tarjetas, opcional)" name="creditLimitCents" type="number" step="0.01" />
    </FormModal>
  );
}
