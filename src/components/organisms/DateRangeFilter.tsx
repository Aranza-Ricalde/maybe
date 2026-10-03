"use client";

import { Popover } from "@heroui/react";
import { useState } from "react";
import { Button } from "react-aria-components";
import { InlinePrefixLabel } from "@/components/atoms/Label";
import { FILTER_PILL_MODIFIERS } from "@/components/molecules/FilterSelect";
import { FilterPopoverHeader } from "@/components/molecules/FilterPopoverHeader";
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
  const [isOpen, setIsOpen] = useState(false);
  const calendarValue = value.start && value.end ? { start: value.start, end: value.end } : null;
  const hasValue = Boolean(value.start || value.end);

  return (
    <Popover.Root isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button className={`select__trigger ${FILTER_PILL_MODIFIERS}`} onPress={() => setIsOpen(true)}>
        <InlinePrefixLabel>Periodo:</InlinePrefixLabel> {rangeLabel(value)}
      </Button>
      <Popover.Content>
        <Popover.Dialog className="flex flex-col gap-1.5 p-2">
          <FilterPopoverHeader
            title="Periodo"
            clearAriaLabel="Limpiar periodo"
            onClear={hasValue ? () => { onChange({ start: null, end: null }); setIsOpen(false); } : undefined}
          />
          <RangeCalendarField
            ariaLabel="Periodo"
            value={calendarValue}
            onChange={(range) => {
              onChange(range);
              setIsOpen(false);
            }}
          />
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
