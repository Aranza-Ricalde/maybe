import { Text } from "@/components/atoms/Text";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";

export interface CreateTransactionAccountOption {
  id: number;
  name: string;
}

export interface CreateTransactionCategoryOption {
  id: number;
  name: string;
}

export interface CreateTransactionModalProps {
  accounts: CreateTransactionAccountOption[];
  categories: CreateTransactionCategoryOption[];
  today: string;
  createTransactionAction: (formData: FormData) => Promise<void> | void;
}

export function CreateTransactionModal({ accounts, categories, today, createTransactionAction }: CreateTransactionModalProps) {
  return (
    <FormModal
      title="Registrar movimiento"
      trigger="+ Registrar movimiento"
      triggerVariant="primary"
      submitLabel="Registrar"
      action={createTransactionAction}
    >
      <SelectField
        label="Cuenta"
        name="accountId"
        defaultValue={accounts[0] ? String(accounts[0].id) : undefined}
        options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
      />
      <SelectField
        label="Categoría (opcional)"
        name="categoryId"
        defaultValue=""
        options={[{ value: "", label: "Sin categoría" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
      />
      <TextInput label="Descripción" name="name" isRequired />
      <TextInput label="Monto" name="amount" type="number" step="0.01" placeholder="-150.00" isRequired />
      <TextInput label="Fecha" name="date" type="date" defaultValue={today} isRequired />
      <Text size="xs" tone="muted">
        Monto positivo = ingreso, negativo = gasto.
      </Text>
    </FormModal>
  );
}
