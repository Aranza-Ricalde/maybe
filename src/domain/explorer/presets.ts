import { shiftMonth } from "@/domain/dashboard/rules";
import { addDays } from "@/domain/payPeriod/rules";

export const EXPLORER_PRESETS = ["period", "30d", "3m", "6m", "12m", "custom"] as const;
export type ExplorerPreset = (typeof EXPLORER_PRESETS)[number];

export const EXPLORER_PRESET_LABELS: Record<ExplorerPreset, string> = {
  period: "Periodo actual",
  "30d": "30 días",
  "3m": "3 meses",
  "6m": "6 meses",
  "12m": "12 meses",
  custom: "Fechas",
};

export interface PresetRange {
  from: string;
  to: string;
}

const MONTHS_BACK: Record<"3m" | "6m" | "12m", number> = { "3m": 2, "6m": 5, "12m": 11 };
const LAST_30_DAYS = 29;

export function resolvePreset(preset: ExplorerPreset, today: string, period: PresetRange | null, custom: PresetRange | null): PresetRange {
  switch (preset) {
    case "period":
      return period ?? { from: addDays(today, -LAST_30_DAYS), to: today };
    case "custom":
      return custom ?? { from: addDays(today, -LAST_30_DAYS), to: today };
    case "30d":
      return { from: addDays(today, -LAST_30_DAYS), to: today };
    default:
      return { from: shiftMonth(`${today.slice(0, 7)}-01`, -MONTHS_BACK[preset]), to: today };
  }
}
