"use client";

import { Popover } from "@heroui/react";
import { useState } from "react";
import { Button } from "react-aria-components";
import { InlinePrefixLabel } from "@/components/atoms/Label";
import { FILTER_PILL_MODIFIERS } from "@/components/molecules/FilterSelect";
import { FilterPopoverHeader } from "@/components/molecules/FilterPopoverHeader";
import { TextInput } from "@/components/molecules/FormField";
import { formatCurrency } from "@/lib/format";

export type AmountFilterMode = "min" | "max";

export interface AmountFilterProps {
  mode: AmountFilterMode;
  amount: string;
  onChange: (mode: AmountFilterMode, amount: string) => void;
}

function valueLabel(mode: AmountFilterMode, amount: string): string {
  if (!amount) return "cualquiera";
  const cents = Math.round(Number(amount) * 100);
  return `${mode === "min" ? "≥" : "≤"} ${formatCurrency(Math.abs(cents))}`;
}

export function AmountFilter({ mode, amount, onChange }: AmountFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover.Root isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button className={`select__trigger ${FILTER_PILL_MODIFIERS}`} onPress={() => setIsOpen(true)}>
        <InlinePrefixLabel>Monto:</InlinePrefixLabel> {valueLabel(mode, amount)}
      </Button>
      <Popover.Content>
        <Popover.Dialog className="flex w-48 flex-col gap-2 p-2">
          <FilterPopoverHeader
            title="Monto"
            clearAriaLabel="Limpiar monto"
            onClear={amount ? () => { onChange(mode, ""); setIsOpen(false); } : undefined}
          />
          <div className="flex gap-1">
            {(["min", "max"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange(m, amount)}
                className={`flex-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                  mode === m ? "bg-accent text-accent-foreground" : "bg-separator text-muted hover:text-foreground"
                }`}
              >
                {m === "min" ? "Mínimo" : "Máximo"}
              </button>
            ))}
          </div>
          <TextInput name="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(value) => onChange(mode, value)} />
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
