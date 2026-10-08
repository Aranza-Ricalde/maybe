"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fromSelectValue, toSelectValue } from "@/lib/selectValue";

export interface TextInputProps extends Omit<ComponentProps<typeof Input>, "onChange" | "value" | "defaultValue"> {
  label?: string;
  description?: ReactNode;
  prefix?: string;
  isRequired?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function TextInput({ label, description, prefix, name, isRequired, onChange, id, className, ...props }: TextInputProps) {
  const fieldId = id ?? (name ? `field-${name}` : undefined);
  const handleChange = onChange ? (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value) : undefined;

  return (
    <Field>
      {label && <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>}
      {prefix ? (
        <InputGroup>
          <InputGroupAddon>{prefix}</InputGroupAddon>
          <InputGroupInput id={fieldId} name={name} required={isRequired} onChange={handleChange} className={className} {...props} />
        </InputGroup>
      ) : (
        <Input id={fieldId} name={name} required={isRequired} onChange={handleChange} className={className} {...props} />
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

export interface TextAreaFieldProps extends Omit<ComponentProps<typeof Textarea>, "onChange"> {
  label?: string;
  description?: ReactNode;
  onChange?: (value: string) => void;
}

export function TextAreaField({ label, description, name, rows = 3, onChange, id, ...props }: TextAreaFieldProps) {
  const fieldId = id ?? (name ? `field-${name}` : undefined);
  return (
    <Field>
      {label && <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>}
      <Textarea id={fieldId} name={name} rows={rows} onChange={onChange ? (event) => onChange(event.target.value) : undefined} {...props} />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label?: string;
  description?: ReactNode;
  ariaLabel?: string;
  name?: string;
  options: SelectFieldOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function SelectField({ label, description, ariaLabel, name, options, defaultValue, value, onChange, placeholder }: SelectFieldProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = value ?? internal;

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      {name && <input type="hidden" name={name} value={current} />}
      <Select
        value={toSelectValue(current)}
        items={options.map((option) => ({ value: toSelectValue(option.value), label: option.label }))}
        onValueChange={(next) => {
          const real = fromSelectValue(next ?? "");
          setInternal(real);
          onChange?.(real);
        }}
      >
        <SelectTrigger className="w-full" aria-label={label ?? ariaLabel ?? placeholder}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={toSelectValue(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}
