import { ColorSwatchPicker } from "@/components/molecules/ColorSwatchPicker";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { ENTITY } from "@/lib/entityLabels";
import { EntityFormModal } from "./EntityFormModal";
import { NO_NATURE_FORM_VALUE, SPENDING_NATURES, SPENDING_NATURE_LABELS, type SpendingNature } from "@/domain/categories/nature";
import { NO_PARENT_FORM_VALUE } from "@/domain/categories/rules";
import type { Flow } from "@/domain/ledger/rules";
import { FLOW_OPTIONS } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

export interface CategoryFormValues {
  id?: number;
  name: string;
  classification: Flow;
  color: string;
  parentId?: number | null;
  nature?: SpendingNature | null;
}

export interface CategoryModalProps {
  mode: "create" | "edit";
  initialValues?: CategoryFormValues;
  parentOptions?: { value: string; label: string }[];
  action: (formData: FormData) => Promise<void> | void;
}

export function CategoryModal({ mode, initialValues, parentOptions = [], action }: CategoryModalProps) {
  const natureOptions = [
    { value: NO_NATURE_FORM_VALUE, label: "Sin clasificar (una subcategoría hereda la de su madre)" },
    ...SPENDING_NATURES.map((n) => ({ value: n, label: SPENDING_NATURE_LABELS[n] })),
  ];
  const parentSelectOptions = [{ value: NO_PARENT_FORM_VALUE, label: "Ninguna (categoría principal)" }, ...parentOptions];

  return (
    <EntityFormModal mode={mode} labels={ENTITY.category} entityId={initialValues?.id}
      action={action}
    >
      <TextInput label="Nombre" name={FIELD.name} defaultValue={initialValues?.name} isRequired />
      <SelectField label="Tipo" name={FIELD.classification} defaultValue={initialValues?.classification ?? "expense"} options={FLOW_OPTIONS} />
      {parentOptions.length > 0 && (
        <SelectField
          label="Categoría madre"
          name={FIELD.parentId}
          defaultValue={initialValues?.parentId != null ? String(initialValues.parentId) : NO_PARENT_FORM_VALUE}
          options={parentSelectOptions}
        />
      )}
      <SelectField label="Naturaleza del gasto" name={FIELD.nature} defaultValue={initialValues?.nature ?? NO_NATURE_FORM_VALUE} options={natureOptions} />
      <ColorSwatchPicker name={FIELD.color} defaultValue={initialValues?.color} />
    </EntityFormModal>
  );
}
