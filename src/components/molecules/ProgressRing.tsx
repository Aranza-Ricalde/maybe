import { cn } from "@/lib/utils";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface ProgressRingProps {
  percent: number;
  over?: boolean;
  label: string;
  color?: string;
  muted?: boolean;
  className?: string;
}

export function ProgressRing({ percent, over = false, label, color, muted = false, className }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className={cn("relative size-24 shrink-0", className)}>
      <svg viewBox="0 0 100 100" role="img" aria-label={`${label}: ${Math.round(percent)}%`} className="size-full -rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="currentColor" className="text-muted" strokeWidth="8" strokeDasharray={muted ? "4 6" : undefined} />
        {!muted && (
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={over ? "var(--destructive)" : (color ?? "var(--primary)")}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        )}
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums", over && "text-destructive", muted && "text-muted-foreground")}>{muted ? "—" : `${Math.round(percent)}%`}</span>
    </div>
  );
}
