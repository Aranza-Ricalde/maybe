"use client";

import { FilterPillPopover } from "@/components/molecules/FilterPillPopover";
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
          <TextInput name={FIELD.amount} type="number" step="0.01" placeholder="0.00" value={amount} onChange={(value) => onChange(mode, value)} />
        </>
      )}
    </FilterPillPopover>
  );
}
