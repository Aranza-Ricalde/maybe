"use client";

import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface ChoiceCardOption<V extends string> {
  value: V;
  title: string;
  description: string;
}

export interface ChoiceCardsProps<V extends string> {
  label: string;
  options: ReadonlyArray<ChoiceCardOption<V>>;
  value: V;
  onChange: (value: V) => void;
  disabledValues?: V[];
}

export function ChoiceCards<V extends string>({ label, options, value, onChange, disabledValues = [] }: ChoiceCardsProps<V>) {
  return (
    <RadioGroup value={value} onValueChange={(next) => onChange(next as V)} aria-label={label} className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <FieldLabel key={option.value} htmlFor={`choice-${label}-${option.value}`}>
          <Field orientation="horizontal" data-disabled={disabledValues.includes(option.value) || undefined}>
            <FieldContent>
              <FieldTitle>{option.title}</FieldTitle>
              <FieldDescription>{option.description}</FieldDescription>
            </FieldContent>
            <RadioGroupItem value={option.value} id={`choice-${label}-${option.value}`} disabled={disabledValues.includes(option.value)} />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  );
}
