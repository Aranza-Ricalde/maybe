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
    <nav aria-label={ariaLabel} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:w-44 md:shrink-0 md:overflow-visible md:px-0">
      <ul className="flex gap-1 md:flex-col">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <li key={item.value}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onChange(item.value)}
                className={cn("w-full rounded-md px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:text-foreground")}
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
