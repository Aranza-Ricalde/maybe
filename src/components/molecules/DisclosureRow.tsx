import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface DisclosureRowProps extends Omit<ComponentProps<"button">, "children"> {
  icon: LucideIcon;
  label: string;
  iconClassName?: string;
  badge?: number;
}

export function DisclosureRow({ icon: Icon, label, iconClassName, badge, className, ...props }: DisclosureRowProps) {
  return (
    <button type="button" className={cn("flex w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm font-medium", className)} {...props}>
      <span className="flex min-w-0 items-center gap-2">
        <Icon className={cn("size-4 shrink-0", iconClassName)} aria-hidden />
        <span className="min-w-0">{label}</span>
        {badge != null && <span className="rounded-full bg-foreground px-2 text-xs font-medium text-background tabular-nums">{badge}</span>}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
