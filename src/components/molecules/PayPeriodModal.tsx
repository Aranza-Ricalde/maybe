"use client";

import type { FormAction } from "@/lib/actionResult";
import { Text } from "@/components/atoms/Text";
import { EntityFormModal } from "@/components/organisms/EntityFormModal";
import { RangeCalendarField } from "@/components/molecules/RangeCalendarField";
import { periodLabel } from "@/domain/payPeriod/rules";
import { usePayPeriodRange } from "@/hooks/usePayPeriodRange";
import { ENTITY } from "@/lib/entityLabels";
import { FIELD } from "@/lib/formFields";

export interface PayPeriodModalProps {
  mode: "create" | "edit";
  initialValues?: { id: number; index?: number; start: string; end: string };
  editTitle?: string;
  defaultStart?: string;
  defaultEnd?: string;
  action: FormAction;
}

export function PayPeriodModal({ mode, initialValues, editTitle, defaultStart, defaultEnd, action }: PayPeriodModalProps) {
  const [range, setRange] = usePayPeriodRange({ initialStart: initialValues?.start, initialEnd: initialValues?.end, defaultStart, defaultEnd });

  return (
    <EntityFormModal mode={mode} labels={ENTITY.payPeriod} entityId={initialValues?.id} editTitle={editTitle ?? `Editar Quincena ${initialValues?.index}`} size="sm" action={action}>
      <input type="hidden" name={FIELD.start} value={range.start} />
      <input type="hidden" name={FIELD.end} value={range.end} />
      <div className="flex flex-col items-center gap-2">
        <Text weight="medium">{periodLabel(range.start, range.end)}</Text>
        <RangeCalendarField ariaLabel="Fechas del periodo" value={range} onChange={setRange} commitPartial />
        <Text size="xs" tone="muted">
          Haz clic en el primer día y luego en el último.
        </Text>
      </div>
    </EntityFormModal>
  );
}
