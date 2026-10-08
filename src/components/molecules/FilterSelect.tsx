"use client";

import { InlinePrefixLabel } from "@/components/atoms/Label";
import { fromSelectValue, toSelectValue } from "@/lib/selectValue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FilterSelectOption {
  id: string;
  label: string;
}

export interface FilterSelectProps {
  label: string;
  options: FilterSelectOption[];
  value: string;
  onChange: (value: string) => void;
}

export const FILTER_PILL_CLASS = "h-8 w-auto gap-1.5 rounded-full text-xs";

export function FilterSelect({ label, options, value, onChange }: FilterSelectProps) {
  return (
    <Select value={toSelectValue(value)} items={options.map((option) => ({ value: toSelectValue(option.id), label: option.label }))} onValueChange={(next) => onChange(fromSelectValue(next ?? ""))}>
      <SelectTrigger size="sm" aria-label={label} className={FILTER_PILL_CLASS}>
        <InlinePrefixLabel>{label}:</InlinePrefixLabel>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={toSelectValue(option.id)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
