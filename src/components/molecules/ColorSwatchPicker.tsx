"use client";

import { useState } from "react";
import { Label } from "@/components/atoms/Label";
import { CATEGORY_PALETTE, DEFAULT_CATEGORY_COLOR } from "@/domain/categories/palette";

export interface ColorSwatchPickerProps {
  name: string;
  defaultValue?: string;
}

export function ColorSwatchPicker({ name, defaultValue = DEFAULT_CATEGORY_COLOR }: ColorSwatchPickerProps) {
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
