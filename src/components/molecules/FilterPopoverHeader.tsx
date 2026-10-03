"use client";

import { Xmark } from "@gravity-ui/icons";
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
        <button
          type="button"
          aria-label={clearAriaLabel}
          className="rounded-full p-1 text-muted hover:bg-separator hover:text-foreground"
          onClick={onClear}
        >
          <Icon icon={Xmark} size="sm" />
        </button>
      )}
    </div>
  );
}
