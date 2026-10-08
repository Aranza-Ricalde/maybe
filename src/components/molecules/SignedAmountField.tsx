"use client";

import { useState } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { joinSignedAmount, splitSignedAmount, type AmountKind } from "@/lib/presenters/amount";

export interface SignedAmountFieldProps {
  name: string;
  defaultValue?: string;
  label?: string;
  placeholder?: string;
}

const KIND_LABEL: Record<AmountKind, string> = { expense: "Gasto", income: "Ingreso" };

export function SignedAmountField({ name, defaultValue, label = "Monto", placeholder = "0.00" }: SignedAmountFieldProps) {
  const initial = splitSignedAmount(defaultValue);
  const [kind, setKind] = useState<AmountKind>(initial.kind);
  const [magnitude, setMagnitude] = useState(initial.magnitude);

  return (
    <Field>
      <FieldLabel htmlFor={`${name}-display`}>{label}</FieldLabel>
      <input type="hidden" name={name} value={joinSignedAmount(kind, magnitude)} />
      <div className="flex gap-2">
        <ToggleGroup type="single" variant="outline" value={kind} onValueChange={(next) => next && setKind(next as AmountKind)} aria-label="Tipo de movimiento">
          {(Object.keys(KIND_LABEL) as AmountKind[]).map((option) => (
            <ToggleGroupItem key={option} value={option} className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              {KIND_LABEL[option]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <InputGroup>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput id={`${name}-display`} data-testid="amount-display" type="number" step="0.01" min="0" inputMode="decimal" placeholder={placeholder} value={magnitude} onChange={(event) => setMagnitude(event.target.value.replace(/^[-+]/, ""))} required />
        </InputGroup>
      </div>
    </Field>
  );
}
