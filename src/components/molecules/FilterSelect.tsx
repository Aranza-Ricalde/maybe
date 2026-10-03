"use client";

import { ListBox, Select } from "@heroui/react";
import { InlinePrefixLabel } from "@/components/atoms/Label";

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

export const FILTER_PILL_MODIFIERS = "gap-1.5 rounded-full text-xs";

export function FilterSelect({ label, options, value, onChange }: FilterSelectProps) {
  return (
    <Select.Root aria-label={label} selectedKey={value} onSelectionChange={(key) => onChange(String(key))}>
      <Select.Trigger className={FILTER_PILL_MODIFIERS}>
        <InlinePrefixLabel>{label}:</InlinePrefixLabel>
        <Select.Value className="text-xs!" />
        <Select.Indicator className="size-3.5" />
      </Select.Trigger>
      <Select.Popover className="max-h-60">
        <ListBox items={options}>{(opt) => <ListBox.Item id={opt.id}>{opt.label}</ListBox.Item>}</ListBox>
      </Select.Popover>
    </Select.Root>
  );
}
