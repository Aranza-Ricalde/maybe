import { SelectField, TextInput } from "@/components/molecules/FormField";
import { SignedAmountField } from "@/components/molecules/SignedAmountField";
import type { AccountOption, CategoryOption } from "@/components/viewModels";
import { FIELD } from "@/lib/formFields";

export interface TransactionFormDefaults {
  accountId?: number;
  categoryId?: number | null;
  name?: string;
  amount?: string;
  date?: string;
}

export interface TransactionFormFieldsProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
  defaults?: TransactionFormDefaults;
}

const NO_CATEGORY_VALUE = "";

export function TransactionFormFields({ accounts, categories, defaults }: TransactionFormFieldsProps) {
  const defaultAccountId = defaults?.accountId ?? accounts[0]?.id;

  return (
    <>
      <TextInput label="Descripción" name={FIELD.name} defaultValue={defaults?.name} placeholder="Ej.: Supermercado" isRequired />
      <SignedAmountField name={FIELD.amount} defaultValue={defaults?.amount} />
      <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <SelectField
          label="Cuenta"
          name={FIELD.accountId}
          defaultValue={defaultAccountId != null ? String(defaultAccountId) : undefined}
          options={accounts.map((account) => ({ value: String(account.id), label: account.name }))}
        />
        <TextInput label="Fecha" name={FIELD.date} type="date" defaultValue={defaults?.date} isRequired />
      </div>
      <SelectField
        label="Categoría"
        description="Opcional. Si la dejas vacía, la sugerimos o la confirmas después."
        name={FIELD.categoryId}
        defaultValue={defaults?.categoryId != null ? String(defaults.categoryId) : NO_CATEGORY_VALUE}
        options={[{ value: NO_CATEGORY_VALUE, label: "Sin categoría" }, ...categories.map((category) => ({ value: String(category.id), label: category.label ?? category.name }))]}
      />
    </>
  );
}
