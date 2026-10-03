import { eq } from "drizzle-orm";
import type { AuthRepository, NewUserInput, SessionWithUser, UserRecord } from "@/domain/auth/ports";
import { db } from "./client";
import { sessions } from "./schema/auth";
import { families, users } from "./schema/core";

function toUserRecord(row: typeof users.$inferSelect): UserRecord {
  return { id: row.id, familyId: row.familyId, email: row.email, name: row.name, passwordHash: row.passwordHash };
}

export class DrizzleAuthRepository implements AuthRepository {
  async hasAnyFamily(): Promise<boolean> {
    const [row] = await db.select({ id: families.id }).from(families).limit(1);
    return row != null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ? toUserRecord(row) : null;
  }

  async createFamilyWithUser(
    familyName: string,
    currency: string,
    user: Omit<NewUserInput, "familyId">,
  ): Promise<UserRecord> {
    return db.transaction(async (tx) => {
      const [family] = await tx.insert(families).values({ name: familyName, currency }).returning();
      const [row] = await tx
        .insert(users)
        .values({ familyId: family.id, email: user.email, passwordHash: user.passwordHash, name: user.name })
        .returning();
      return toUserRecord(row);
    });
  }

  async createSession(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await db.insert(sessions).values({ userId, tokenHash, expiresAt });
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionWithUser | null> {
    const [row] = await db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);
    if (!row) return null;
    return {
      id: row.session.id,
      userId: row.session.userId,
      tokenHash: row.session.tokenHash,
      expiresAt: row.session.expiresAt,
      user: toUserRecord(row.user),
    };
  }

  async deleteSessionByTokenHash(tokenHash: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
}
