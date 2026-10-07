"use client";

import { FieldError, Select, TextArea, TextField } from "@heroui/react";
import type { ComponentProps } from "react";
import { Input } from "@/components/atoms/Input";
import { InlinePrefixLabel, Label } from "@/components/atoms/Label";
import { SelectOptionsPopover } from "./SelectOptionsPopover";

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

export function TextAreaField({ label, name, placeholder, rows = 3, ...props }: { label?: string; name: string; placeholder?: string; rows?: number } & Omit<ComponentProps<typeof TextField>, "children">) {
  return (
    <TextField name={name} {...props} className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      <TextArea placeholder={placeholder} rows={rows} />
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
  ariaLabel?: string;
  name?: string;
  options: SelectFieldOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  isRequired?: boolean;
}

export function SelectField({ label, ariaLabel, name, options, defaultValue, value, onChange, placeholder, isRequired }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <InlinePrefixLabel tone="strong">{label}</InlinePrefixLabel>}
      <Select.Root
        aria-label={label ?? ariaLabel ?? placeholder}
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
        <SelectOptionsPopover options={options.map((option) => ({ id: option.value, label: option.label }))} />
      </Select.Root>
    </div>
  );
}
