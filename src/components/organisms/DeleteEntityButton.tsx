import type { FormAction } from "@/lib/actionResult";
import type { ReactNode } from "react";
import { FIELD } from "@/lib/formFields";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

export interface DeleteEntityButtonProps {
  noun: string;
  name: string;
  id: number;
  idField?: string;
  helperText?: ReactNode;
  action: FormAction;
}

export function DeleteEntityButton({ noun, name, id, idField = FIELD.id, helperText, action }: DeleteEntityButtonProps) {
  return (
    <ConfirmDeleteButton
      title={`Eliminar ${noun}`}
      triggerAriaLabel={`Eliminar ${name}`}
      confirmQuestion={
        <>
          ¿Eliminar <span className="font-semibold">&ldquo;{name}&rdquo;</span>?
        </>
      }
      helperText={helperText}
      hiddenFields={{ [idField]: id }}
      action={action}
    />
  );
}
