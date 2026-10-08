"use client";

import { FilterPillPopover } from "@/components/molecules/FilterPillPopover";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/molecules/FormField";
import { formatCurrency } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

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
  return (
    <FilterPillPopover
      label="Monto"
      valueLabel={valueLabel(mode, amount)}
      title="Monto"
      clearAriaLabel="Limpiar monto"
      onClear={amount ? () => onChange(mode, "") : undefined}
      dialogClassName="flex w-48 flex-col gap-2 p-2"
    >
      {() => (
        <>
          <div className="flex gap-1">
            {(["min", "max"] as const).map((m) => (
              <Button key={m} type="button" size="xs" variant={mode === m ? "default" : "secondary"} className="flex-1 rounded-full" onClick={() => onChange(m, amount)}>
                {m === "min" ? "Mínimo" : "Máximo"}
              </Button>
            ))}
          </div>
          <TextInput name={FIELD.amount} type="number" step="0.01" placeholder="0.00" value={amount} onChange={(value) => onChange(mode, value)} />
        </>
      )}
    </FilterPillPopover>
  );
}
