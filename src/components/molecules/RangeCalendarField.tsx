"use client";

import { parseDate } from "@internationalized/date";
import { RangeCalendar } from "@heroui/react";

export interface RangeCalendarFieldValue {
  start: string;
  end: string;
}

export interface RangeCalendarFieldProps {
  value: RangeCalendarFieldValue | null;
  onChange: (value: RangeCalendarFieldValue) => void;
  ariaLabel?: string;
  className?: string;
}

export function RangeCalendarField({ value, onChange, ariaLabel = "Rango de fechas", className = "w-52! max-w-52!" }: RangeCalendarFieldProps) {
  const calendarValue = value ? { start: parseDate(value.start), end: parseDate(value.end) } : null;

  return (
    <RangeCalendar
      aria-label={ariaLabel}
      value={calendarValue}
      className={className}
      onChange={(range) => onChange({ start: range.start.toString(), end: range.end.toString() })}
    >
      <RangeCalendar.Header className="pb-2!">
        <RangeCalendar.NavButton slot="previous" className="size-5!" />
        <RangeCalendar.Heading className="text-xs!" />
        <RangeCalendar.NavButton slot="next" className="size-5!" />
      </RangeCalendar.Header>
      <RangeCalendar.Grid>
        <RangeCalendar.GridHeader>{(day) => <RangeCalendar.HeaderCell className="pb-1! text-[10px]!">{day}</RangeCalendar.HeaderCell>}</RangeCalendar.GridHeader>
        <RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
      </RangeCalendar.Grid>
    </RangeCalendar>
  );
}
