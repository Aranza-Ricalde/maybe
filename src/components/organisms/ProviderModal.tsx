import { Pencil } from "@gravity-ui/icons";
import { Icon } from "@/components/atoms/Icon";
import { TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";

export interface ProviderFormValues {
  id?: number;
  name: string;
}

export interface ProviderModalProps {
  mode: "create" | "edit";
  initialValues?: ProviderFormValues;
  action: (formData: FormData) => Promise<void> | void;
}

const EDIT_TRIGGER_CLASSNAME =
  "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground";

export function ProviderModal({ mode, initialValues, action }: ProviderModalProps) {
  const isEdit = mode === "edit";

  return (
    <FormModal
      title={isEdit ? "Editar proveedor" : "Nuevo proveedor"}
      trigger={isEdit ? <Icon icon={Pencil} /> : "+ Nuevo proveedor"}
      triggerVariant={isEdit ? "ghost" : "primary"}
      triggerIsIconOnly={isEdit}
      triggerAriaLabel={isEdit ? "Editar proveedor" : undefined}
      triggerClassName={isEdit ? EDIT_TRIGGER_CLASSNAME : undefined}
      submitLabel={isEdit ? "Guardar cambios" : "Crear proveedor"}
      size="sm"
      action={action}
    >
      {isEdit && initialValues?.id != null && <input type="hidden" name="id" value={initialValues.id} />}
      <TextInput label="Nombre" name="name" defaultValue={initialValues?.name} isRequired />
    </FormModal>
  );
}
