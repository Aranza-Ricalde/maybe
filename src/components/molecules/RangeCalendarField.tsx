"use client";

import { es } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { dayRangeFromIso, isoRangeFromDays, type IsoRange } from "@/lib/calendarRange";

export type RangeCalendarFieldValue = IsoRange;

export interface RangeCalendarFieldProps {
  value: RangeCalendarFieldValue | null;
  onChange: (value: RangeCalendarFieldValue) => void;
  ariaLabel?: string;
  className?: string;
  commitPartial?: boolean;
}

export function RangeCalendarField({ value, onChange, ariaLabel = "Rango de fechas", className, commitPartial = false }: RangeCalendarFieldProps) {
  return (
    <Calendar
      mode="range"
      locale={es}
      aria-label={ariaLabel}
      selected={dayRangeFromIso(value)}
      defaultMonth={dayRangeFromIso(value)?.from}
      className={className}
      onSelect={(selection) => {
        const range = isoRangeFromDays(selection) ?? (commitPartial ? isoRangeFromDays(selection?.from ? { from: selection.from, to: selection.from } : undefined) : null);
        if (range) onChange(range);
      }}
    />
  );
}
