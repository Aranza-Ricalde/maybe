import type { FormAction } from "@/lib/actionResult";
import { Pencil } from "lucide-react";
import { AccountFormFields } from "@/components/molecules/AccountFormFields";
import { FormModal } from "@/components/organisms/FormModal";
import { isLiabilityAccountType, type AccountType } from "@/domain/accounts/rules";
import type { DebtTerms } from "@/domain/debts/rules";
import { FIELD } from "@/lib/formFields";

export interface EditAccountModalProps {
  accountId: number;
  name: string;
  type: AccountType;
  creditLimitCents: number | null;
  debtTerms: DebtTerms;
  updateAccountAction: FormAction;
}

export function EditAccountModal({ accountId, name, type, creditLimitCents, debtTerms, updateAccountAction }: EditAccountModalProps) {
  return (
    <FormModal title="Editar cuenta" iconTrigger={{ icon: Pencil, label: "Editar cuenta" }} submitLabel="Guardar cambios" action={updateAccountAction}>
      <input type="hidden" name={FIELD.accountId} value={accountId} />
      <AccountFormFields defaults={{ name, type, creditLimitCents }} debtTerms={isLiabilityAccountType(type) ? debtTerms : undefined} />
    </FormModal>
  );
}
