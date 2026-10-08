import { sparklinePath } from "@/lib/presenters/sparkline";
import { cn } from "@/lib/utils";

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  label?: string;
}

export function Sparkline({ values, width = 96, height = 28, className, label }: SparklineProps) {
  const path = sparklinePath(values, width, height);
  if (!path) return <span aria-hidden className={cn("inline-block", className)} style={{ width, height }} />;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("shrink-0 text-primary", className)}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
