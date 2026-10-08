"use client";

import { useState, type ReactNode } from "react";
import { InlinePrefixLabel } from "@/components/atoms/Label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FilterPopoverHeader } from "./FilterPopoverHeader";
import { FILTER_PILL_CLASS } from "./FilterSelect";

export interface FilterPillPopoverProps {
  label: string;
  valueLabel: string;
  title: string;
  clearAriaLabel: string;
  onClear?: () => void;
  dialogClassName?: string;
  children: (close: () => void) => ReactNode;
}

export function FilterPillPopover({ label, valueLabel, title, clearAriaLabel, onClear, dialogClassName, children }: FilterPillPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn(FILTER_PILL_CLASS, "font-normal")}>
          <InlinePrefixLabel>{`${label}:`}</InlinePrefixLabel> {valueLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("flex w-auto flex-col gap-2", dialogClassName)}>
        <FilterPopoverHeader
          title={title}
          clearAriaLabel={clearAriaLabel}
          onClear={
            onClear
              ? () => {
                  onClear();
                  close();
                }
              : undefined
          }
        />
        {children(close)}
      </PopoverContent>
    </Popover>
  );
}
