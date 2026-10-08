"use client";

import { useState } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { CATEGORY_PALETTE, DEFAULT_CATEGORY_COLOR } from "@/domain/categories/palette";

export interface ColorSwatchPickerProps {
  name: string;
  defaultValue?: string;
}

export function ColorSwatchPicker({ name, defaultValue = DEFAULT_CATEGORY_COLOR }: ColorSwatchPickerProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Field>
      <FieldLabel>Color</FieldLabel>
      <div role="group" aria-label="Color" className="flex flex-wrap gap-3 p-1">
        <input type="hidden" name={name} value={value} />
        {CATEGORY_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Color ${color}`}
            aria-pressed={value === color}
            onClick={() => setValue(color)}
            className={`size-7 rounded-full transition-transform ${value === color ? "ring-2 ring-offset-2 ring-offset-background" : "hover:scale-110"}`}
            style={{ background: color, ...(value === color ? ({ "--tw-ring-color": color } as Record<string, string>) : {}) }}
          />
        ))}
      </div>
    </Field>
  );
}
