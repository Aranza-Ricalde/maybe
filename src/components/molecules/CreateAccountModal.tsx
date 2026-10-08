import type { FormAction } from "@/lib/actionResult";
import { AccountFormFields } from "@/components/molecules/AccountFormFields";
import { FormModal } from "@/components/organisms/FormModal";

export interface CreateAccountModalProps {
  createAccountAction: FormAction;
}

export function CreateAccountModal({ createAccountAction }: CreateAccountModalProps) {
  return (
    <FormModal title="Nueva cuenta" trigger="+ Nueva cuenta" submitLabel="Crear cuenta" action={createAccountAction}>
      <AccountFormFields />
    </FormModal>
  );
}
