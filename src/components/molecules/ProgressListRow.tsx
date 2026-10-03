import { Text } from "@/components/atoms/Text";

export interface ProgressListRowProps {
  label: string;
  value: string;
  percent: number;
  barColor?: string;
}

export function ProgressListRow({ label, value, percent, barColor = "var(--accent)" }: ProgressListRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <Text weight="medium">{label}</Text>
        <Text tone="muted" className="shrink-0 tabular-nums">
          {value}
        </Text>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-separator">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, percent * 100)}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}
