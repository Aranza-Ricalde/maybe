export interface AttemptLimitPolicy {
  maxFailures: number;
  windowMs: number;
}

export interface AttemptLimitDecision {
  allowed: boolean;
  retryAfterMs: number;
}

export const LOGIN_EMAIL_POLICY: AttemptLimitPolicy = { maxFailures: 5, windowMs: 15 * 60 * 1000 };
export const LOGIN_IP_POLICY: AttemptLimitPolicy = { maxFailures: 20, windowMs: 15 * 60 * 1000 };

export const API_TOKEN_IP_POLICY: AttemptLimitPolicy = { maxFailures: 10, windowMs: 15 * 60 * 1000 };

export function recentFailures(failureTimes: number[], now: number, windowMs: number): number[] {
  return failureTimes.filter((t) => now - t < windowMs);
}

export function decideAttempt(failureTimes: number[], now: number, policy: AttemptLimitPolicy): AttemptLimitDecision {
  const recent = recentFailures(failureTimes, now, policy.windowMs);
  if (recent.length < policy.maxFailures) return { allowed: true, retryAfterMs: 0 };
  const oldestCounting = recent[recent.length - policy.maxFailures];
  return { allowed: false, retryAfterMs: Math.max(0, oldestCounting + policy.windowMs - now) };
}

export interface AttemptLimiter {
  check(key: string, policy: AttemptLimitPolicy): Promise<AttemptLimitDecision>;
  recordFailure(key: string, policy: AttemptLimitPolicy): Promise<void>;
  reset(key: string): Promise<void>;
}
