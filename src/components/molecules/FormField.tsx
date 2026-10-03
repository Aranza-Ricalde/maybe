"use client";

import { FieldError, ListBox, Select, TextField } from "@heroui/react";
import type { ComponentProps } from "react";
import { Input } from "@/components/atoms/Input";
import { InlinePrefixLabel, Label } from "@/components/atoms/Label";

export function TextInput({
  label,
  name,
  type,
  step,
  min,
  max,
  placeholder,
  ...props
}: { label?: string; name: string; type?: string; step?: string; min?: string; max?: string; placeholder?: string } & Omit<
  ComponentProps<typeof TextField>,
  "children" | "type"
>) {
  return (
    <TextField name={name} {...props} className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      <Input type={type} step={step} min={min} max={max} placeholder={placeholder} />
      <FieldError className="text-xs text-danger" />
    </TextField>
  );
}

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label?: string;
  name?: string;
  options: SelectFieldOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  isRequired?: boolean;
}

export function SelectField({ label, name, options, defaultValue, value, onChange, placeholder, isRequired }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <InlinePrefixLabel tone="strong">{label}</InlinePrefixLabel>}
      <Select.Root
        aria-label={label ?? placeholder}
        name={name}
        isRequired={isRequired}
        placeholder={placeholder}
        selectedKey={value}
        defaultSelectedKey={defaultValue}
        onSelectionChange={onChange ? (key) => onChange(String(key)) : undefined}
      >
        <Select.Trigger className="w-full justify-between">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover className="max-h-60">
          <ListBox items={options}>{(opt) => <ListBox.Item id={opt.value}>{opt.label}</ListBox.Item>}</ListBox>
        </Select.Popover>
      </Select.Root>
    </div>
  );
}
