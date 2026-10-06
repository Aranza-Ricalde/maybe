import { Pencil } from "@gravity-ui/icons";
import { TransactionFormFields } from "@/components/molecules/TransactionFormFields";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { centsToInputValue } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { FormModal } from "./FormModal";

export interface EditTransactionFormValues {
  id: number;
  accountId: number;
  categoryId: number | null;
  name: string;
  amountCents: number;
  date: string;
}

export interface EditTransactionModalProps {
  initialValues: EditTransactionFormValues;
  accounts: AccountOption[];
  categories: CategoryOption[];
  action: (formData: FormData) => Promise<void> | void;
}

export function EditTransactionModal({ initialValues, accounts, categories, action }: EditTransactionModalProps) {
  return (
    <FormModal title="Editar movimiento" iconTrigger={{ icon: Pencil, label: "Editar movimiento" }} submitLabel="Guardar cambios" action={action}>
      <input type="hidden" name={FIELD.id} value={initialValues.id} />
      <TransactionFormFields
        accounts={accounts}
        categories={categories}
        defaults={{ ...initialValues, amount: centsToInputValue(initialValues.amountCents) }}
      />
    </FormModal>
  );
}
