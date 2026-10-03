import type { SelectHTMLAttributes } from "react";

export type SelectUiSize = "sm" | "md";

const SELECT_SIZE_CLASS: Record<SelectUiSize, string> = {
  sm: "h-8 px-2 text-xs",
  md: "h-10 px-3 text-sm",
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  uiSize?: SelectUiSize;
}

export function Select({ uiSize = "md", className = "", ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`${SELECT_SIZE_CLASS[uiSize]} rounded-field border border-separator bg-field text-field-foreground shadow-sm outline-none focus:ring-2 focus:ring-focus ${className}`.trim()}
    />
  );
}
