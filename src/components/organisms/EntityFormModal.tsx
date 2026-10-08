import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { type EntityLabels, SAVE_CHANGES_LABEL } from "@/lib/entityLabels";
import { FIELD } from "@/lib/formFields";
import { FormModal, type FormModalProps } from "./FormModal";

export type EntityFormMode = "create" | "edit";

export interface EntityFormModalProps {
  mode: EntityFormMode;
  labels: EntityLabels;
  entityId?: number;
  editTitle?: string;
  size?: FormModalProps["size"];
  action: FormModalProps["action"];
  children: ReactNode;
}

export function EntityFormModal({ mode, labels, entityId, editTitle = labels.editTitle, size, action, children }: EntityFormModalProps) {
  const isEdit = mode === "edit";

  return (
    <FormModal
      title={isEdit ? editTitle : labels.createTitle}
      trigger={isEdit ? undefined : labels.createTrigger}
      iconTrigger={isEdit ? { icon: Pencil, label: editTitle } : undefined}
      submitLabel={isEdit ? SAVE_CHANGES_LABEL : labels.createSubmit}
      size={size}
      action={action}
    >
      {isEdit && entityId != null && <input type="hidden" name={FIELD.id} value={entityId} />}
      {children}
    </FormModal>
  );
}
