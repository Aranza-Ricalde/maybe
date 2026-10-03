import { Pencil } from "@gravity-ui/icons";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";
import { centsToInputValue } from "@/lib/format";

export interface EditTransactionAccountOption {
  id: number;
  name: string;
}

export interface EditTransactionCategoryOption {
  id: number;
  name: string;
}

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
  accounts: EditTransactionAccountOption[];
  categories: EditTransactionCategoryOption[];
  action: (formData: FormData) => Promise<void> | void;
}

const TRIGGER_CLASSNAME =
  "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground";

export function EditTransactionModal({ initialValues, accounts, categories, action }: EditTransactionModalProps) {
  return (
    <FormModal
      title="Editar movimiento"
      trigger={<Icon icon={Pencil} />}
      triggerVariant="ghost"
      triggerIsIconOnly
      triggerAriaLabel="Editar movimiento"
      triggerClassName={TRIGGER_CLASSNAME}
      submitLabel="Guardar cambios"
      action={action}
    >
      <input type="hidden" name="id" value={initialValues.id} />
      <SelectField
        label="Cuenta"
        name="accountId"
        defaultValue={String(initialValues.accountId)}
        options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
      />
      <SelectField
        label="Categoría (opcional)"
        name="categoryId"
        defaultValue={initialValues.categoryId != null ? String(initialValues.categoryId) : ""}
        options={[{ value: "", label: "Sin categoría" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
      />
      <TextInput label="Descripción" name="name" defaultValue={initialValues.name} isRequired />
      <TextInput label="Monto" name="amount" type="number" step="0.01" defaultValue={centsToInputValue(initialValues.amountCents)} isRequired />
      <TextInput label="Fecha" name="date" type="date" defaultValue={initialValues.date} isRequired />
      <Text size="xs" tone="muted">
        Monto positivo = ingreso, negativo = gasto.
      </Text>
    </FormModal>
  );
}
