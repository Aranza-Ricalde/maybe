import { Text } from "@/components/atoms/Text";
import { SelectField, TextInput } from "@/components/molecules/FormField";
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
  amountPlaceholder?: string;
}

const NO_CATEGORY_VALUE = "";

export function TransactionFormFields({ accounts, categories, defaults, amountPlaceholder }: TransactionFormFieldsProps) {
  const defaultAccountId = defaults?.accountId ?? accounts[0]?.id;

  return (
    <>
      <SelectField
        label="Cuenta"
        name={FIELD.accountId}
        defaultValue={defaultAccountId != null ? String(defaultAccountId) : undefined}
        options={accounts.map((account) => ({ value: String(account.id), label: account.name }))}
      />
      <SelectField
        label="Categoría (opcional)"
        name={FIELD.categoryId}
        defaultValue={defaults?.categoryId != null ? String(defaults.categoryId) : NO_CATEGORY_VALUE}
        options={[{ value: NO_CATEGORY_VALUE, label: "Sin categoría" }, ...categories.map((category) => ({ value: String(category.id), label: category.label ?? category.name }))]}
      />
      <TextInput label="Descripción" name={FIELD.name} defaultValue={defaults?.name} isRequired />
      <TextInput label="Monto" name={FIELD.amount} type="number" step="0.01" placeholder={amountPlaceholder} defaultValue={defaults?.amount} isRequired />
      <TextInput label="Fecha" name={FIELD.date} type="date" defaultValue={defaults?.date} isRequired />
      <Text size="xs" tone="muted">
        Monto positivo = ingreso, negativo = gasto.
      </Text>
    </>
  );
}
