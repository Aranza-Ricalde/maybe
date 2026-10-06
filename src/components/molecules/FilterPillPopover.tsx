"use client";

import { Popover } from "@heroui/react";
import { useState, type ReactNode } from "react";
import { Button } from "react-aria-components";
import { InlinePrefixLabel } from "@/components/atoms/Label";
import { FilterPopoverHeader } from "./FilterPopoverHeader";
import { FILTER_PILL_MODIFIERS } from "./FilterSelect";

export interface FilterPillPopoverProps {
  label: string;
  valueLabel: string;
  title: string;
  clearAriaLabel: string;
  onClear?: () => void;
  dialogClassName: string;
  children: (close: () => void) => ReactNode;
}

export function FilterPillPopover({ label, valueLabel, title, clearAriaLabel, onClear, dialogClassName, children }: FilterPillPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <Popover.Root isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button className={`select__trigger ${FILTER_PILL_MODIFIERS}`} onPress={() => setIsOpen(true)}>
        <InlinePrefixLabel>{`${label}:`}</InlinePrefixLabel> {valueLabel}
      </Button>
      <Popover.Content>
        <Popover.Dialog className={dialogClassName}>
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
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
