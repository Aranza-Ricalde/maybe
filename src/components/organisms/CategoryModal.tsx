import { Pencil } from "@gravity-ui/icons";
import { Icon } from "@/components/atoms/Icon";
import { ColorSwatchPicker } from "@/components/molecules/ColorSwatchPicker";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";
import type { Flow } from "@/domain/ledger/rules";
import { FLOW_OPTIONS } from "@/lib/format";

export interface CategoryFormValues {
  id?: number;
  name: string;
  classification: Flow;
  color: string;
}

export interface CategoryModalProps {
  mode: "create" | "edit";
  initialValues?: CategoryFormValues;
  action: (formData: FormData) => Promise<void> | void;
}

const EDIT_TRIGGER_CLASSNAME =
  "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground";

export function CategoryModal({ mode, initialValues, action }: CategoryModalProps) {
  const isEdit = mode === "edit";

  return (
    <FormModal
      title={isEdit ? "Editar categoría" : "Nueva categoría"}
      trigger={isEdit ? <Icon icon={Pencil} /> : "+ Nueva categoría"}
      triggerVariant={isEdit ? "ghost" : "primary"}
      triggerIsIconOnly={isEdit}
      triggerAriaLabel={isEdit ? "Editar categoría" : undefined}
      triggerClassName={isEdit ? EDIT_TRIGGER_CLASSNAME : undefined}
      submitLabel={isEdit ? "Guardar cambios" : "Crear categoría"}
      action={action}
    >
      {isEdit && initialValues?.id != null && <input type="hidden" name="id" value={initialValues.id} />}
      <TextInput label="Nombre" name="name" defaultValue={initialValues?.name} isRequired />
      <SelectField label="Tipo" name="classification" defaultValue={initialValues?.classification ?? "expense"} options={FLOW_OPTIONS} />
      <ColorSwatchPicker name="color" defaultValue={initialValues?.color} />
    </FormModal>
  );
}
