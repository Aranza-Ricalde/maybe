"use client";

import type { FormAction } from "@/lib/actionResult";
import { TextInput } from "@/components/molecules/FormField";
import { centsToInputValue, formatPesos } from "@/lib/format";
import { FormModal } from "./FormModal";
import { FIELD } from "@/lib/formFields";

export interface MinimumBalanceModalProps {
  minimumCents: number;
  action: FormAction;
}

export function MinimumBalanceModal({ minimumCents, action }: MinimumBalanceModalProps) {
  return (
    <FormModal
      title="Saldo mínimo para el aviso"
      trigger={`Cambiar (${formatPesos(minimumCents)})`}
      triggerVariant="ghost"
      triggerClassName="text-xs"
      submitLabel="Guardar"
      size="sm"
      action={action}
    >
      <p className="text-sm text-muted-foreground">
        La proyección te avisa el día en que tu saldo en cuentas de débito y efectivo caería por debajo de este monto. Piensa en él como tu colchón de seguridad.
      </p>
      <TextInput label="Saldo mínimo" prefix="$" name={FIELD.minimum} type="number" step="0.01" min="0" defaultValue={centsToInputValue(minimumCents)} isRequired />
    </FormModal>
  );
}
