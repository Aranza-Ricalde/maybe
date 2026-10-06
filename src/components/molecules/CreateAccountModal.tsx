import { AccountFormFields } from "@/components/molecules/AccountFormFields";
import { FormModal } from "@/components/organisms/FormModal";

export interface CreateAccountModalProps {
  createAccountAction: (formData: FormData) => Promise<void> | void;
}

export function CreateAccountModal({ createAccountAction }: CreateAccountModalProps) {
  return (
    <FormModal title="Nueva cuenta" trigger="+ Nueva cuenta" submitLabel="Crear cuenta" action={createAccountAction}>
      <AccountFormFields />
    </FormModal>
  );
}
