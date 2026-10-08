"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AccountOption } from "@/components/viewModels";

export interface AccountMultiSelectProps {
  label?: string;
  description?: string;
  name: string;
  options: AccountOption[];
  defaultValue?: number[];
}

export function AccountMultiSelect({ label, description, name, options, defaultValue = [] }: AccountMultiSelectProps) {
  const [selected, setSelected] = useState<number[]>(defaultValue);
  const toggle = (id: number, checked: boolean) => setSelected((current) => (checked ? [...current, id] : current.filter((value) => value !== id)));

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <Popover>
        <PopoverTrigger render={<Button type="button" variant="outline" aria-label={label ?? "Cuentas vinculadas"} className="w-full justify-between font-normal" />}>
            {selected.length === 0 ? "Ninguna cuenta" : `${selected.length} cuenta${selected.length === 1 ? "" : "s"}`}
            <Icon icon={ChevronDown} />
          </PopoverTrigger>
        <PopoverContent align="start" className="flex max-h-60 w-(--anchor-width) flex-col gap-1 overflow-y-auto">
          {options.map((option) => (
            <label key={option.id} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
              <Checkbox checked={selected.includes(option.id)} onCheckedChange={(checked) => toggle(option.id, checked === true)} />
              {option.name}
            </label>
          ))}
        </PopoverContent>
      </Popover>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}
