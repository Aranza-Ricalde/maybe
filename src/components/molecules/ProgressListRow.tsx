import { Text } from "@/components/atoms/Text";
import { Progress } from "@/components/ui/progress";

export interface ProgressListRowProps {
  label: string;
  value: string;
  percent: number;
  barColor?: string;
}

export function ProgressListRow({ label, value, percent, barColor }: ProgressListRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <Text weight="medium">{label}</Text>
        <Text tone="muted" className="shrink-0 tabular-nums">
          {value}
        </Text>
      </div>
      <Progress value={Math.min(100, percent * 100)} indicatorColor={barColor} aria-label={label} className="h-1.5" />
    </div>
  );
}
