import { Pencil } from "@gravity-ui/icons";
import { Icon } from "@/components/atoms/Icon";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";
import type { Flow } from "@/domain/ledger/rules";
import { FLOW_OPTIONS } from "@/lib/format";

export interface RecurringItemAccountOption {
  id: number;
  name: string;
}

export interface RecurringItemCategoryOption {
  id: number;
  name: string;
}

export interface RecurringItemConceptOption {
  id: number;
  name: string;
}

export interface RecurringItemFormValues {
  id?: number;
  name: string;
  flow: Flow;
  estimatedAmount: number;
  categoryId: number | null;
  conceptId: number | null;
  accountId: number | null;
  dayOfMonth: number;
}

export interface RecurringItemModalProps {
  mode: "create" | "edit";
  initialValues?: RecurringItemFormValues;
  accounts: RecurringItemAccountOption[];
  categories: RecurringItemCategoryOption[];
  concepts: RecurringItemConceptOption[];
  action: (formData: FormData) => Promise<void> | void;
}

const EDIT_TRIGGER_CLASSNAME =
  "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground";

export function RecurringItemModal({ mode, initialValues, accounts, categories, concepts, action }: RecurringItemModalProps) {
  const isEdit = mode === "edit";

  return (
    <FormModal
      title={isEdit ? "Editar recurrente" : "Nuevo recurrente"}
      trigger={isEdit ? <Icon icon={Pencil} /> : "+ Nuevo recurrente"}
      triggerVariant={isEdit ? "ghost" : "primary"}
      triggerIsIconOnly={isEdit}
      triggerAriaLabel={isEdit ? "Editar recurrente" : undefined}
      triggerClassName={isEdit ? EDIT_TRIGGER_CLASSNAME : undefined}
      submitLabel={isEdit ? "Guardar cambios" : "Crear recurrente"}
      action={action}
    >
      {isEdit && initialValues?.id != null && <input type="hidden" name="id" value={initialValues.id} />}
      <SelectField
        label="Concepto (opcional)"
        name="conceptId"
        defaultValue={initialValues?.conceptId != null ? String(initialValues.conceptId) : ""}
        options={[{ value: "", label: "Sin concepto — usar nombre/categoría de abajo" }, ...concepts.map((c) => ({ value: String(c.id), label: c.name }))]}
      />
      <TextInput label="Nombre" name="name" defaultValue={initialValues?.name} isRequired />
      <SelectField label="Tipo" name="flow" defaultValue={initialValues?.flow ?? "expense"} options={FLOW_OPTIONS} />
      <TextInput
        label="Monto estimado"
        name="estimatedAmount"
        type="number"
        step="0.01"
        min="0"
        defaultValue={initialValues ? String(Math.abs(initialValues.estimatedAmount)) : undefined}
        isRequired
      />
      <TextInput
        label="Día del mes"
        name="dayOfMonth"
        type="number"
        min="1"
        max="31"
        defaultValue={String(initialValues?.dayOfMonth ?? 1)}
        isRequired
      />
      <SelectField
        label="Categoría (ignorada si eliges un concepto arriba)"
        name="categoryId"
        defaultValue={initialValues?.categoryId != null ? String(initialValues.categoryId) : ""}
        options={[{ value: "", label: "Sin categoría" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
      />
      <SelectField
        label="Cuenta habitual (opcional, es solo una referencia — no es obligatoria para el match)"
        name="accountId"
        defaultValue={initialValues?.accountId != null ? String(initialValues.accountId) : ""}
        options={[{ value: "", label: "Sin cuenta específica" }, ...accounts.map((a) => ({ value: String(a.id), label: a.name }))]}
      />
    </FormModal>
  );
}
