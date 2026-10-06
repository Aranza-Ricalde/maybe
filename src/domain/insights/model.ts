export type InsightTone = "positive" | "change" | "attention" | "goal";

export interface Insight {
  id: string;
  tone: InsightTone;
  message: string;
  detail?: string;
  href?: string;
  weight: number;
}

export const MIN_CATEGORY_CHANGE_CENTS = 30_000;
export const MIN_CATEGORY_CHANGE_PCT = 0.15;
export const MIN_STREAK_MONTHS = 3;
export const FAST_GROWTH_PCT = 0.5;
export const FAST_GROWTH_MIN_CENTS = 50_000;
export const SAVINGS_RATE_SHIFT = 0.1;
export const MIN_NET_WORTH_CHANGE_CENTS = 50_000;
export const DUPLICATE_MIN_CENTS = 10_000;
export const DUPLICATE_WINDOW_DAYS = 2;
export const DUPLICATE_LOOKBACK_DAYS = 45;
export const UNUSUAL_RECENT_DAYS = 30;
export const UNUSUAL_HISTORY_DAYS = 90;
export const UNUSUAL_MIN_HISTORY = 5;
export const UNUSUAL_MULTIPLE = 3;
export const UNUSUAL_MIN_CENTS = 50_000;
export const SIMILAR_AMOUNT_RATIO = 0.5;
export const PRICE_INCREASE_MIN_PCT = 0.1;
export const PRICE_INCREASE_MIN_CENTS = 10_000;
export const RECURRING_LOOKBACK_DAYS = 45;
export const MAX_INSIGHTS_PER_TONE: Record<InsightTone, number> = { change: 3, attention: 4, goal: 2, positive: 3 };
