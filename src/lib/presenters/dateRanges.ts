import { addDays } from "@/domain/payPeriod/rules";

export const QUICK_RANGE_OPTIONS = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "7 días" },
  { value: "month", label: "Este mes" },
  { value: "all", label: "Todo" },
] as const;

export type QuickRangeKey = (typeof QUICK_RANGE_OPTIONS)[number]["value"];

export interface QuickRange {
  start: string | null;
  end: string | null;
}

export function quickRange(key: QuickRangeKey, today: string): QuickRange {
  if (key === "today") return { start: today, end: today };
  if (key === "week") return { start: addDays(today, -6), end: today };
  if (key === "month") return { start: `${today.slice(0, 8)}01`, end: today };
  return { start: null, end: null };
}

export function activeQuickRange(range: QuickRange, today: string): QuickRangeKey | "" {
  const match = QUICK_RANGE_OPTIONS.find((option) => {
    const candidate = quickRange(option.value, today);
    return candidate.start === (range.start ?? null) && candidate.end === (range.end ?? null);
  });
  return match?.value ?? "";
}
