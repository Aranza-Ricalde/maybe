import { ActionForm } from "@/components/molecules/ActionForm";
import { Button } from "@/components/ui/button";
import type { FormAction } from "@/lib/actionResult";
import { FIELD } from "@/lib/formFields";

export interface DecisionButtonsProps {
  id: number;
  confirmAction: FormAction;
  dismissAction: FormAction;
  confirmLabel?: string;
  dismissLabel?: string;
}

function DecisionForm({ id, action, variant, label }: { id: number; action: FormAction; variant: "default" | "ghost"; label: string }) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name={FIELD.id} value={id} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </ActionForm>
  );
}

export function DecisionButtons({ id, confirmAction, dismissAction, confirmLabel = "Sí", dismissLabel = "No" }: DecisionButtonsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <DecisionForm id={id} action={confirmAction} variant="default" label={confirmLabel} />
      <DecisionForm id={id} action={dismissAction} variant="ghost" label={dismissLabel} />
    </div>
  );
}
