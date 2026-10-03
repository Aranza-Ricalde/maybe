"use client";

import { useState } from "react";
import { Label } from "@/components/atoms/Label";

export const CATEGORY_PALETTE = ["#0d7d6f", "#2563eb", "#b45309", "#be123c", "#7c3aed", "#0891b2"] as const;

export interface ColorSwatchPickerProps {
  name: string;
  defaultValue?: string;
}

export function ColorSwatchPicker({ name, defaultValue = CATEGORY_PALETTE[0] }: ColorSwatchPickerProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Color</Label>
      <div className="flex gap-2">
        <input type="hidden" name={name} value={value} />
        {CATEGORY_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Color ${color}`}
            aria-pressed={value === color}
            onClick={() => setValue(color)}
            className={`size-7 rounded-full transition-transform ${value === color ? "ring-2 ring-offset-2 ring-offset-surface" : "hover:scale-110"}`}
            style={{ background: color, ...(value === color ? ({ "--tw-ring-color": color } as Record<string, string>) : {}) }}
          />
        ))}
      </div>
    </div>
  );
}
