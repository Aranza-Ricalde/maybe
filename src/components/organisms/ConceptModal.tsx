import { Pencil } from "@gravity-ui/icons";
import { Icon } from "@/components/atoms/Icon";
import { SelectField, TextInput } from "@/components/molecules/FormField";
import { FormModal } from "./FormModal";
import type { Flow } from "@/domain/ledger/rules";
import { FLOW_OPTIONS } from "@/lib/format";

export interface ConceptCategoryOption {
  id: number;
  name: string;
}

export interface ConceptProviderOption {
  id: number;
  name: string;
}

export interface ConceptFormValues {
  id?: number;
  name: string;
  categoryId: number;
  providerId: number | null;
  flow: Flow;
}

export interface ConceptModalProps {
  mode: "create" | "edit";
  initialValues?: ConceptFormValues;
  categories: ConceptCategoryOption[];
  providers: ConceptProviderOption[];
  action: (formData: FormData) => Promise<void> | void;
}

const EDIT_TRIGGER_CLASSNAME =
  "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground";

export function ConceptModal({ mode, initialValues, categories, providers, action }: ConceptModalProps) {
  const isEdit = mode === "edit";

  return (
    <FormModal
      title={isEdit ? "Editar concepto" : "Nuevo concepto"}
      trigger={isEdit ? <Icon icon={Pencil} /> : "+ Nuevo concepto"}
      triggerVariant={isEdit ? "ghost" : "primary"}
      triggerIsIconOnly={isEdit}
      triggerAriaLabel={isEdit ? "Editar concepto" : undefined}
      triggerClassName={isEdit ? EDIT_TRIGGER_CLASSNAME : undefined}
      submitLabel={isEdit ? "Guardar cambios" : "Crear concepto"}
      action={action}
    >
      {isEdit && initialValues?.id != null && <input type="hidden" name="id" value={initialValues.id} />}
      <TextInput label="Nombre" name="name" placeholder="Internet Casa" defaultValue={initialValues?.name} isRequired />
      <SelectField
        label="Categoría"
        name="categoryId"
        isRequired
        defaultValue={initialValues?.categoryId != null ? String(initialValues.categoryId) : undefined}
        options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
      />
      <SelectField
        label="Proveedor (opcional)"
        name="providerId"
        defaultValue={initialValues?.providerId != null ? String(initialValues.providerId) : ""}
        options={[{ value: "", label: "Sin proveedor" }, ...providers.map((p) => ({ value: String(p.id), label: p.name }))]}
      />
      {!isEdit && <SelectField label="Tipo" name="flow" defaultValue={initialValues?.flow ?? "expense"} options={FLOW_OPTIONS} />}
    </FormModal>
  );
}
