"use client";

import { cn } from "@/lib/utils";

export interface PillTabsProps<V extends string> {
  options: ReadonlyArray<{ value: V; label: string }>;
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
}

export function PillTabs<V extends string>({ options, value, onChange, ariaLabel }: PillTabsProps<V>) {
  return (
    <div role="group" aria-label={ariaLabel} className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors", option.value === value ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
