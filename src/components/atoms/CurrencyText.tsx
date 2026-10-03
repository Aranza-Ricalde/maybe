import type { ComponentProps } from "react";
import { amountSignPrefix, formatCurrency } from "@/lib/format";
import { Text } from "./Text";

export interface CurrencyTextProps extends Omit<ComponentProps<typeof Text>, "children"> {
  cents: number;
  withSign?: boolean;
  absolute?: boolean;
}

export function CurrencyText({ cents, withSign = false, absolute = false, className = "", ...props }: CurrencyTextProps) {
  const amount = absolute ? Math.abs(cents) : cents;
  return (
    <Text className={`tabular-nums ${className}`.trim()} {...props}>
      {withSign ? amountSignPrefix(cents) : ""}
      {formatCurrency(amount)}
    </Text>
  );
}
