"use client";

import { ListBox, Select } from "@heroui/react";
import { useState } from "react";
import type { Key } from "react-aria-components";
import { Label } from "@/components/atoms/Label";

export interface AccountMultiSelectOption {
  id: number;
  name: string;
}

export interface AccountMultiSelectProps {
  label?: string;
  name: string;
  options: AccountMultiSelectOption[];
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
        <Select.Popover className="max-h-60">
          <ListBox items={options}>{(opt) => <ListBox.Item id={opt.id}>{opt.name}</ListBox.Item>}</ListBox>
        </Select.Popover>
      </Select.Root>
    </div>
  );
}
