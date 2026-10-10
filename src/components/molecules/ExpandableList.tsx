"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LIMIT_CLASS = {
  3: "max-md:[&>li:nth-child(n+4)]:hidden",
  5: "max-md:[&>li:nth-child(n+6)]:hidden",
} as const;

export type ExpandableLimit = keyof typeof LIMIT_CLASS;

export interface ExpandableListProps {
  count: number;
  mobileLimit: ExpandableLimit;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
  children: ReactNode;
}

export function ExpandableList({ count, mobileLimit, expandLabel, collapseLabel = "Ver menos", className, children }: ExpandableListProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = expandLabel != null && count > mobileLimit;

  return (
    <>
      <ul className={cn(className, !expanded && LIMIT_CLASS[mobileLimit])}>{children}</ul>
      {canExpand && (
        <Button type="button" variant="ghost" size="sm" className="w-full md:hidden" aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>
          {expanded ? collapseLabel : expandLabel}
        </Button>
      )}
    </>
  );
}
