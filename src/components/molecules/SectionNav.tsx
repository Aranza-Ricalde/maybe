"use client";

import { cn } from "@/lib/utils";

export interface SectionNavItem<V extends string> {
  value: V;
  label: string;
}

export interface SectionNavProps<V extends string> {
  items: ReadonlyArray<SectionNavItem<V>>;
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
}

export function SectionNav<V extends string>({ items, value, onChange, ariaLabel }: SectionNavProps<V>) {
  return (
    <nav aria-label={ariaLabel} className="-mx-3 overflow-x-auto px-3 md:mx-0 md:w-44 md:shrink-0 md:overflow-visible md:px-0">
      <ul className="flex gap-2 md:flex-col md:gap-1">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <li key={item.value}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onChange(item.value)}
                className={cn("w-full text-left text-sm font-medium whitespace-nowrap transition-colors max-md:rounded-full max-md:px-4 max-md:py-1.5 md:rounded-md md:px-3 md:py-2 md:hover:bg-muted", active ? "max-md:bg-foreground max-md:text-background md:bg-sidebar-accent md:text-sidebar-accent-foreground" : "max-md:bg-muted text-muted-foreground hover:text-foreground")}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
