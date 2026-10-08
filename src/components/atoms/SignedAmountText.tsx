import type { ComponentProps } from "react";
import { formatCurrencyCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SignedAmountTextProps extends Omit<ComponentProps<"span">, "children"> {
  cents: number;
}

export function SignedAmountText({ cents, className, ...props }: SignedAmountTextProps) {
  return (
    <span className={cn("font-semibold tabular-nums", cents >= 0 && "text-success", className)} {...props}>
      {cents < 0 ? "−" : "+"}
      {formatCurrencyCompact(Math.abs(cents))}
    </span>
  );
}
