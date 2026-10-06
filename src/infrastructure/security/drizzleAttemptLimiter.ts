import { and, eq, gt, lte } from "drizzle-orm";
import { decideAttempt, type AttemptLimiter, type AttemptLimitDecision, type AttemptLimitPolicy } from "@/domain/auth/attemptLimit";
import { db } from "@/infrastructure/db/client";
import { loginAttempts } from "@/infrastructure/db/schema/security";

export class DrizzleAttemptLimiter implements AttemptLimiter {
  async check(key: string, policy: AttemptLimitPolicy): Promise<AttemptLimitDecision> {
    const now = Date.now();
    const rows = await db
      .select({ attemptedAt: loginAttempts.attemptedAt })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.attemptKey, key), gt(loginAttempts.attemptedAt, new Date(now - policy.windowMs))))
      .orderBy(loginAttempts.attemptedAt);
    return decideAttempt(rows.map((row) => row.attemptedAt.getTime()), now, policy);
  }

  async recordFailure(key: string, policy: AttemptLimitPolicy): Promise<void> {
    const now = Date.now();
    await db.insert(loginAttempts).values({ attemptKey: key, attemptedAt: new Date(now) });
    await db.delete(loginAttempts).where(and(eq(loginAttempts.attemptKey, key), lte(loginAttempts.attemptedAt, new Date(now - policy.windowMs))));
  }

  async reset(key: string): Promise<void> {
    await db.delete(loginAttempts).where(eq(loginAttempts.attemptKey, key));
  }
}
