"use client";

import { Select } from "@heroui/react";
import { useState } from "react";
import type { Key } from "react-aria-components";
import { Label } from "@/components/atoms/Label";
import type { AccountOption } from "@/components/viewModels";
import { SelectOptionsPopover } from "./SelectOptionsPopover";

export interface AccountMultiSelectProps {
  label?: string;
  name: string;
  options: AccountOption[];
  defaultValue?: number[];
}

export function AccountMultiSelect({ label, name, options, defaultValue = [] }: AccountMultiSelectProps) {
  const [selected, setSelected] = useState<Key[]>(defaultValue);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      <Select.Root
        aria-label={label ?? "Cuentas vinculadas"}
        name={name}
        selectionMode="multiple"
        value={selected}
        onChange={setSelected}
      >
        <Select.Trigger className="w-full justify-between">
          <Select.Value>{selected.length === 0 ? "Ninguna cuenta" : `${selected.length} cuenta${selected.length === 1 ? "" : "s"}`}</Select.Value>
          <Select.Indicator />
        </Select.Trigger>
        <SelectOptionsPopover options={options.map((option) => ({ id: option.id, label: option.name }))} />
      </Select.Root>
    </div>
  );
}
