import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SettingsRowProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsRow({ title, description, children, className }: SettingsRowProps) {
  return (
    <div className={cn("flex flex-col gap-3 border-t py-5 md:flex-row md:gap-10", className)}>
      <div className="md:w-64 md:shrink-0">
        <p className="font-medium">{title}</p>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
