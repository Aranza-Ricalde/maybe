export type HealthKey = "savings" | "spending" | "debt" | "emergency" | "bills";

export interface HealthInput {
  savingsRate: number | null;
  budgetUsage: number | null;
  debtToAssets: number | null;
  emergencyMonths: number | null;
  emergencyTargetMonths: number;
  billsPaidRatio: number | null;
}

export interface HealthFactor {
  key: HealthKey;
  score: number;
}

export type HealthLevel = "excellent" | "good" | "fair" | "poor";

export interface HealthScore {
  score: number;
  level: HealthLevel;
  factors: HealthFactor[];
}

const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)));
const TARGET_SAVINGS_RATE = 0.2;
const COMFORTABLE_USAGE = 0.8;
const MAX_USAGE = 1.2;
const LOW_DEBT = 0.1;
const HIGH_DEBT = 0.6;

export function healthLevel(score: number): HealthLevel {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
}

export function computeHealthScore(input: HealthInput): HealthScore | null {
  const factors: HealthFactor[] = [];
  if (input.savingsRate != null) factors.push({ key: "savings", score: clamp((input.savingsRate / TARGET_SAVINGS_RATE) * 100) });
  if (input.budgetUsage != null) factors.push({ key: "spending", score: clamp(((MAX_USAGE - input.budgetUsage) / (MAX_USAGE - COMFORTABLE_USAGE)) * 100) });
  if (input.debtToAssets != null) factors.push({ key: "debt", score: clamp(((HIGH_DEBT - input.debtToAssets) / (HIGH_DEBT - LOW_DEBT)) * 100) });
  if (input.emergencyMonths != null && input.emergencyTargetMonths > 0) factors.push({ key: "emergency", score: clamp((input.emergencyMonths / input.emergencyTargetMonths) * 100) });
  if (input.billsPaidRatio != null) factors.push({ key: "bills", score: clamp(input.billsPaidRatio * 100) });
  if (factors.length === 0) return null;
  const score = Math.round(factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length);
  return { score, level: healthLevel(score), factors };
}
