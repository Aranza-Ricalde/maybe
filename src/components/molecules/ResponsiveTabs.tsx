"use client";

import { useId, useState, type ReactNode } from "react";
import { PillTabs } from "@/components/molecules/PillTabs";
import { cn } from "@/lib/utils";

export interface ResponsiveTab {
  id: string;
  label: string;
  content: ReactNode;
  className?: string;
}

export interface ResponsiveTabsProps {
  tabs: ResponsiveTab[];
  ariaLabel: string;
  panelsClassName?: string;
  className?: string;
}

export function ResponsiveTabs({ tabs, ariaLabel, panelsClassName, className }: ResponsiveTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const baseId = useId();

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="md:hidden">
        <PillTabs options={tabs.map((tab) => ({ value: tab.id, label: tab.label }))} value={active} onChange={setActive} ariaLabel={ariaLabel} />
      </div>
      <div className={panelsClassName}>
        {tabs.map((tab) => (
          <section key={tab.id} id={`${baseId}-${tab.id}`} aria-label={tab.label} className={cn("min-w-0", tab.className, tab.id !== active && "max-md:hidden")}>
            {tab.content}
          </section>
        ))}
      </div>
    </div>
  );
}
