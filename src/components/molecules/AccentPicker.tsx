"use client";

import { Check } from "lucide-react";
import { useAccentPreference } from "@/hooks/useAccentPreference";
import { ACCENTS, ACCENT_LABELS, ACCENT_SWATCHES } from "@/lib/accent";
import { cn } from "@/lib/utils";

export function AccentPicker() {
  const { accent, setAccent } = useAccentPreference();

  return (
    <div role="group" aria-label="Color de acento" className="flex flex-wrap gap-3">
      {ACCENTS.map((option) => {
        const selected = option === accent;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            aria-label={ACCENT_LABELS[option]}
            title={ACCENT_LABELS[option]}
            onClick={() => setAccent(option)}
            className={cn("flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", selected ? "ring-2 ring-foreground" : "hover:scale-105")}
            style={{ background: ACCENT_SWATCHES[option] }}
          >
            {selected && <Check className="size-4 text-white" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
