import type { ReactNode } from "react";

export interface EyebrowLabelProps {
  children: ReactNode;
  className?: string;
}

export function EyebrowLabel({ children, className = "" }: EyebrowLabelProps) {
  return <p className={`text-xs font-medium tracking-wide text-muted-foreground uppercase ${className}`.trim()}>{children}</p>;
}
