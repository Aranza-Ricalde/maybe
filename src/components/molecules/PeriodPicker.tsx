"use client";

import { Calendar as CalendarIcon, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RangeCalendarField, type RangeCalendarFieldValue } from "./RangeCalendarField";

export interface PeriodPickerPreset {
  value: string;
  label: string;
}

export interface PeriodPickerProps {
  presets: PeriodPickerPreset[];
  value: string;
  customLabel: string;
  isCustom: boolean;
  customRange: RangeCalendarFieldValue | null;
  onPresetChange: (value: string) => void;
  onCustomChange: (range: RangeCalendarFieldValue) => void;
}

export function PeriodPicker({ presets, value, customLabel, isCustom, customRange, onPresetChange, onCustomChange }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const current = isCustom ? customLabel : (presets.find((preset) => preset.value === value)?.label ?? "");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button type="button" variant="outline" size="sm" aria-label="Elegir periodo" />}>
          <Icon icon={CalendarIcon} size="sm" />
          {current}
          <Icon icon={ChevronDown} size="sm" />
        </PopoverTrigger>
      <PopoverContent align="start" className="flex w-auto flex-col gap-1 p-2">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant="ghost"
            size="sm"
            className={cn("justify-between gap-6", !isCustom && preset.value === value && "bg-muted")}
            onClick={() => {
              onPresetChange(preset.value);
              setOpen(false);
            }}
          >
            {preset.label}
            {!isCustom && preset.value === value && <Icon icon={Check} size="sm" />}
          </Button>
        ))}
        <Separator className="my-1" />
        <p className="px-2 text-xs font-medium text-muted-foreground">Fechas personalizadas</p>
        <RangeCalendarField
          ariaLabel="Fechas personalizadas"
          value={customRange}
          onChange={(range) => {
            onCustomChange(range);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
