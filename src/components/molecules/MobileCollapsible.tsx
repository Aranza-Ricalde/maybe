"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MobileCollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

export function MobileCollapsible({ title, defaultOpen = false, className, children }: MobileCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm font-medium md:hidden">
        {title}
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <div id={panelId} className={cn(!open && "max-md:hidden")}>
        {children}
      </div>
    </div>
  );
}
