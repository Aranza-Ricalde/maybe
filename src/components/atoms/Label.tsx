import { Label as HeroLabel } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

export type LabelProps = ComponentProps<typeof HeroLabel>;

export function Label({ className = "", ...props }: LabelProps) {
  return <HeroLabel className={`text-sm font-medium text-foreground ${className}`.trim()} {...props} />;
}

export type InlinePrefixLabelTone = "muted" | "strong";

const INLINE_PREFIX_LABEL_CLASS: Record<InlinePrefixLabelTone, string> = {
  muted: "text-muted",
  strong: "text-sm font-medium text-foreground",
};

export function InlinePrefixLabel({ children, tone = "muted" }: { children: ReactNode; tone?: InlinePrefixLabelTone }) {
  return <span className={INLINE_PREFIX_LABEL_CLASS[tone]}>{children}</span>;
}
