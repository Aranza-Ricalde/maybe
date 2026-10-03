"use client";

import { Pencil } from "@gravity-ui/icons";
import { useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { FormModal } from "@/components/organisms/FormModal";
import { RangeCalendarField } from "@/components/molecules/RangeCalendarField";
import { periodLabel } from "@/domain/payPeriod/rules";

export interface PayPeriodModalProps {
  mode: "create" | "edit";
  initialValues?: { id: number; index: number; start: string; end: string };
  defaultStart?: string;
  defaultEnd?: string;
  action: (formData: FormData) => Promise<void> | void;
}

const EDIT_TRIGGER_CLASSNAME =
  "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground";

export function PayPeriodModal({ mode, initialValues, defaultStart, defaultEnd, action }: PayPeriodModalProps) {
  const isEdit = mode === "edit";
  const today = new Date().toISOString().slice(0, 10);
  const [range, setRange] = useState({
    start: initialValues?.start ?? defaultStart ?? today,
    end: initialValues?.end ?? defaultEnd ?? today,
  });

  return (
    <FormModal
      title={isEdit ? `Editar Quincena ${initialValues?.index}` : "Nuevo periodo"}
      trigger={isEdit ? <Icon icon={Pencil} /> : "+ Nuevo periodo"}
      triggerVariant={isEdit ? "ghost" : "primary"}
      triggerIsIconOnly={isEdit}
      triggerAriaLabel={isEdit ? `Editar Quincena ${initialValues?.index}` : undefined}
      triggerClassName={isEdit ? EDIT_TRIGGER_CLASSNAME : undefined}
      submitLabel={isEdit ? "Guardar cambios" : "Crear periodo"}
      size="sm"
      action={action}
    >
      {isEdit && initialValues?.id != null && <input type="hidden" name="id" value={initialValues.id} />}
      <input type="hidden" name="start" value={range.start} />
      <input type="hidden" name="end" value={range.end} />
      <div className="flex flex-col items-center gap-2">
        <Text weight="medium">{periodLabel(range.start, range.end)}</Text>
        <RangeCalendarField ariaLabel="Fechas del periodo" value={range} onChange={setRange} />
      </div>
    </FormModal>
  );
}
