import { useState } from "react";
import { todayIso } from "@/lib/today";

export interface PayPeriodRangeDefaults {
  initialStart?: string;
  initialEnd?: string;
  defaultStart?: string;
  defaultEnd?: string;
}

export function usePayPeriodRange({ initialStart, initialEnd, defaultStart, defaultEnd }: PayPeriodRangeDefaults) {
  const today = todayIso();
  return useState({ start: initialStart ?? defaultStart ?? today, end: initialEnd ?? defaultEnd ?? today });
}
