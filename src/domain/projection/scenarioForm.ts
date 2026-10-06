import type { ScenarioAdjustment } from "./rules";

export interface ScenarioFormValues {
  kind: string;
  categoryId: string;
  percent: string;
  direction: string;
  amount: string;
  month: string;
  repeat: string;
}

export interface ScenarioFormNeeds {
  isAllocation: boolean;
  needsAmount: boolean;
  needsPercent: boolean;
}

export function scenarioFormNeeds(kind: string): ScenarioFormNeeds {
  const isAllocation = kind === "allocate_debt" || kind === "allocate_savings";
  return {
    isAllocation,
    needsAmount: kind === "monthly_change" || kind === "one_time" || isAllocation,
    needsPercent: kind === "cut_category" || kind === "cut_discretionary",
  };
}

export function buildAdjustment(values: ScenarioFormValues): ScenarioAdjustment | null {
  const { isAllocation, needsAmount } = scenarioFormNeeds(values.kind);
  const amountCents = Math.round(Number(values.amount) * 100);
  const percent = Number(values.percent);
  const month = Number(values.month);

  if (needsAmount) {
    if (!Number.isFinite(amountCents) || amountCents <= 0) return null;
  } else if (!(percent > 0 && percent <= 100) || (values.kind === "cut_category" && values.categoryId === "")) {
    return null;
  }

  const signedAmountCents = values.direction === "expense" ? -amountCents : amountCents;
  if (values.kind === "cut_category") return { kind: "cut_category", categoryId: Number(values.categoryId), percent };
  if (values.kind === "cut_discretionary") return { kind: "cut_discretionary", percent };
  if (isAllocation) return { kind: "allocate", target: values.kind === "allocate_debt" ? "debt" : "savings", amountCents, fromMonth: month, repeat: values.repeat === "monthly" };
  if (values.kind === "monthly_change") return { kind: "monthly_change", amountCents: signedAmountCents, fromMonth: month };
  return { kind: "one_time", amountCents: signedAmountCents, month };
}
