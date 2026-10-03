import type { ReactNode } from "react";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import { InfoTooltip } from "./InfoTooltip";

export interface StatBlockProps {
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "danger";
  hint?: ReactNode;
  tooltip?: string;
}

export function StatBlock({ label, value, tone = "default", hint, tooltip }: StatBlockProps) {
  const toneClass = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground";

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <EyebrowLabel>{label}</EyebrowLabel>
        {tooltip && <InfoTooltip label={tooltip} />}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {hint}
    </div>
  );
}
