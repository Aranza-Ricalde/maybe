
export const DEFAULT_EMERGENCY_FUND_TARGET_MONTHS = 3;

export type Trend = "up" | "down" | "flat";

export function trendOf(deltaCents: number): Trend {
  return deltaCents > 0 ? "up" : deltaCents < 0 ? "down" : "flat";
}

export function netWorthCents(input: { assetsCents: number; liabilitiesCents: number }): number {
  return input.assetsCents + input.liabilitiesCents;
}

export interface NetWorthChange {
  deltaCents: number;
  trend: Trend;
}

export function netWorthChange(currentCents: number, previousCents: number): NetWorthChange {
  const deltaCents = currentCents - previousCents;
  return { deltaCents, trend: trendOf(deltaCents) };
}

export function savingsRate(input: { incomeCents: number; savedCents: number }): number | null {
  if (input.incomeCents <= 0) return null;
  return input.savedCents / input.incomeCents;
}

export function isEmergencyFundGoalName(name: string): boolean {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("emergencia");
}

export interface EmergencyFundInput {
  fundCents: number;
  essentialMonthlyCents: number | null;
  targetMonths: number;
  targetCents?: number | null;
}

export interface EmergencyFundResult {
  coverageMonths: number | null;
  targetMonths: number;
  progress: number | null;
  missingCents: number | null;
}

export function emergencyFund(input: EmergencyFundInput): EmergencyFundResult {
  const essential = input.essentialMonthlyCents;
  if (essential == null || essential <= 0) {
    return { coverageMonths: null, targetMonths: input.targetMonths, progress: null, missingCents: null };
  }
  const coverageMonths = Math.max(0, input.fundCents) / essential;
  const targetMonths = input.targetCents != null && input.targetCents > 0 ? input.targetCents / essential : input.targetMonths;
  return {
    coverageMonths,
    targetMonths,
    progress: coverageMonths / targetMonths,
    missingCents: Math.max(0, Math.round(targetMonths * essential - Math.max(0, input.fundCents))),
  };
}
