import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export { Label } from "@/components/ui/label";

export type InlinePrefixLabelTone = "muted" | "strong";

const INLINE_PREFIX_LABEL_CLASS: Record<InlinePrefixLabelTone, string> = {
  muted: "text-muted-foreground",
  strong: "text-sm font-medium text-foreground",
};

export function InlinePrefixLabel({ children, tone = "muted" }: { children: ReactNode; tone?: InlinePrefixLabelTone }) {
  return <span className={cn(INLINE_PREFIX_LABEL_CLASS[tone])}>{children}</span>;
}
