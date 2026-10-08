import { useState } from "react";
import type { PeriodRange } from "@/domain/payPeriod/rules";
import { paydayCount, upcomingPayrollDates, upcomingPeriodStarts, type PayrollFrequency, type PayrollMode, type PayrollSetup } from "@/domain/recurring/payroll";
import { parseDayInput } from "@/lib/presenters/payroll";

export interface UsePayrollFormOptions {
  setup: PayrollSetup | null;
  periods: PeriodRange[];
  suggestedMonthlyDay: number | null;
  today: string;
}

const DEFAULT_FREQUENCY: PayrollFrequency = "biweekly";
const PREVIEW_COUNT = 3;

export function usePayrollForm({ setup, periods, suggestedMonthlyDay, today }: UsePayrollFormOptions) {
  const [frequency, setFrequency] = useState<PayrollFrequency>(setup?.frequency ?? DEFAULT_FREQUENCY);
  const [wantsSync, setWantsSync] = useState(setup ? setup.mode === "sync" : true);
  const [amount, setAmount] = useState(setup ? String(setup.amountCents / 100) : "");
  const [manualDays, setManualDays] = useState<string[]>(() => [setup?.days[0]?.toString() ?? suggestedMonthlyDay?.toString() ?? "", setup?.days[1]?.toString() ?? ""]);

  const count = paydayCount(frequency);
  const syncAvailable = frequency === "biweekly" && upcomingPeriodStarts(periods, today, 1).length > 0;
  const mode: PayrollMode = wantsSync && syncAvailable ? "sync" : "manual";
  const days = manualDays.slice(0, count).map(parseDayInput).filter((day): day is number => day !== null);
  const parsedAmount = Number(amount);
  const amountCents = Number.isFinite(parsedAmount) && parsedAmount > 0 ? Math.round(parsedAmount * 100) : 0;

  return {
    frequency,
    setFrequency,
    mode,
    syncAvailable,
    setSync: setWantsSync,
    amount,
    setAmount,
    manualDays,
    setManualDay: (index: number, value: string) => setManualDays((current) => current.map((day, i) => (i === index ? value : day))),
    paydayCount: count,
    previewDates: upcomingPayrollDates({ frequency, mode, days }, periods, today, PREVIEW_COUNT),
    amountCents,
    monthlyCents: amountCents * (mode === "sync" ? 2 : count),
  };
}
