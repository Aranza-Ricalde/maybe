import { eq } from "drizzle-orm";
import type { ApiTokenInfo, ApiTokenRepository } from "@/domain/captures/ports";
import { db } from "./client";
import { apiTokens } from "./schema/security";

export class DrizzleApiTokenRepository implements ApiTokenRepository {
  async replaceToken(familyId: number, tokenHash: string, lastFour: string): Promise<void> {
    await db
      .insert(apiTokens)
      .values({ familyId, tokenHash, lastFour })
      .onConflictDoUpdate({ target: apiTokens.familyId, set: { tokenHash, lastFour, createdAt: new Date(), lastUsedAt: null } });
  }

  async findFamilyByHash(tokenHash: string): Promise<number | null> {
    const [row] = await db.select({ familyId: apiTokens.familyId }).from(apiTokens).where(eq(apiTokens.tokenHash, tokenHash)).limit(1);
    return row?.familyId ?? null;
  }

  async markUsed(tokenHash: string): Promise<void> {
    await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.tokenHash, tokenHash));
  }

  async describe(familyId: number): Promise<ApiTokenInfo | null> {
    const [row] = await db.select({ lastFour: apiTokens.lastFour, createdAt: apiTokens.createdAt, lastUsedAt: apiTokens.lastUsedAt }).from(apiTokens).where(eq(apiTokens.familyId, familyId)).limit(1);
    return row ?? null;
  }
}
