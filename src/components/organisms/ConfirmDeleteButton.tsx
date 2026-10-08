import type { FormAction } from "@/lib/actionResult";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Text } from "@/components/atoms/Text";
import { FormModal } from "@/components/organisms/FormModal";

export interface ConfirmDeleteButtonProps {
  title: string;
  triggerAriaLabel: string;
  confirmQuestion: ReactNode;
  helperText?: ReactNode;
  hiddenFields: Record<string, string | number>;
  action: FormAction;
  submitLabel?: string;
  pendingLabel?: string;
}

export function ConfirmDeleteButton({
  title,
  triggerAriaLabel,
  confirmQuestion,
  helperText,
  hiddenFields,
  action,
  submitLabel = "Sí, eliminar",
  pendingLabel = "Eliminando…",
}: ConfirmDeleteButtonProps) {
  return (
    <FormModal
      title={title}
      iconTrigger={{ icon: Trash2, label: triggerAriaLabel, tone: "danger" }}
      submitLabel={submitLabel}
      submitVariant="destructive"
      pendingLabel={pendingLabel}
      size="sm"
      action={action}
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Text size="sm">{confirmQuestion}</Text>
      {helperText && (
        <Text size="sm" tone="muted">
          {helperText}
        </Text>
      )}
    </FormModal>
  );
}
