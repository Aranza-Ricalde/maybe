import { TrashBin } from "@gravity-ui/icons";
import type { ReactNode } from "react";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { FormModal } from "@/components/organisms/FormModal";

export interface ConfirmDeleteButtonProps {
  title: string;
  triggerAriaLabel: string;
  confirmQuestion: ReactNode;
  helperText?: ReactNode;
  hiddenFields: Record<string, string | number>;
  action: (formData: FormData) => Promise<void> | void;
  submitLabel?: string;
  pendingLabel?: string;
}

const TRIGGER_CLASSNAME =
  "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-danger";

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
      trigger={<Icon icon={TrashBin} />}
      triggerVariant="ghost"
      triggerIsIconOnly
      triggerAriaLabel={triggerAriaLabel}
      triggerClassName={TRIGGER_CLASSNAME}
      submitLabel={submitLabel}
      submitVariant="danger"
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
