"use client";

import { FilterPillPopover } from "@/components/molecules/FilterPillPopover";
import { RangeCalendarField } from "@/components/molecules/RangeCalendarField";
import { formatShortDate } from "@/lib/format";

export interface DateRangeValue {
  start: string | null;
  end: string | null;
}

export interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

function rangeLabel(value: DateRangeValue): string {
  if (!value.start || !value.end) return "Todas las fechas";
  if (value.start === value.end) return formatShortDate(value.start);
  return `${formatShortDate(value.start)} – ${formatShortDate(value.end)}`;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const calendarValue = value.start && value.end ? { start: value.start, end: value.end } : null;
  const hasValue = Boolean(value.start || value.end);

  return (
    <FilterPillPopover
      label="Periodo"
      valueLabel={rangeLabel(value)}
      title="Periodo"
      clearAriaLabel="Limpiar periodo"
      onClear={hasValue ? () => onChange({ start: null, end: null }) : undefined}
      dialogClassName="flex flex-col gap-1.5 p-2"
    >
      {(close) => (
        <RangeCalendarField
          ariaLabel="Periodo"
          value={calendarValue}
          onChange={(range) => {
            onChange(range);
            close();
          }}
        />
      )}
    </FilterPillPopover>
  );
}
