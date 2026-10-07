"use client";

import { useState } from "react";
import { Text } from "@/components/atoms/Text";
import { EntityFormModal } from "@/components/organisms/EntityFormModal";
import { RangeCalendarField } from "@/components/molecules/RangeCalendarField";
import { periodLabel } from "@/domain/payPeriod/rules";
import { todayIso } from "@/lib/today";
import { ENTITY } from "@/lib/entityLabels";
import { FIELD } from "@/lib/formFields";

export interface PayPeriodModalProps {
  mode: "create" | "edit";
  initialValues?: { id: number; index?: number; start: string; end: string };
  editTitle?: string;
  defaultStart?: string;
  defaultEnd?: string;
  action: (formData: FormData) => Promise<void> | void;
}

export function PayPeriodModal({ mode, initialValues, editTitle, defaultStart, defaultEnd, action }: PayPeriodModalProps) {
  const today = todayIso();
  const [range, setRange] = useState({
    start: initialValues?.start ?? defaultStart ?? today,
    end: initialValues?.end ?? defaultEnd ?? today,
  });

  return (
    <EntityFormModal mode={mode} labels={ENTITY.payPeriod} entityId={initialValues?.id} editTitle={editTitle ?? `Editar Quincena ${initialValues?.index}`} size="sm" action={action}>
      <input type="hidden" name={FIELD.start} value={range.start} />
      <input type="hidden" name={FIELD.end} value={range.end} />
      <div className="flex flex-col items-center gap-2">
        <Text weight="medium">{periodLabel(range.start, range.end)}</Text>
        <RangeCalendarField ariaLabel="Fechas del periodo" value={range} onChange={setRange} />
      </div>
    </EntityFormModal>
  );
}
