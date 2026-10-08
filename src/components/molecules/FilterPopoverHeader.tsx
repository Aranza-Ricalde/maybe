"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";

export interface FilterPopoverHeaderProps {
  title: string;
  clearAriaLabel: string;
  onClear?: () => void;
}

export function FilterPopoverHeader({ title, clearAriaLabel, onClear }: FilterPopoverHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <Text size="xs" tone="muted" weight="medium">
        {title}
      </Text>
      {onClear && (
        <Button type="button" variant="ghost" size="icon-xs" aria-label={clearAriaLabel} onClick={onClear}>
          <Icon icon={X} size="sm" />
        </Button>
      )}
    </div>
  );
}
