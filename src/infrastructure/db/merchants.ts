import { and, eq } from "drizzle-orm";
import type { MerchantPatternRecord, MerchantPatternRepository } from "@/domain/merchants/ports";
import { db } from "./client";
import { merchantPatterns } from "./schema/classification";

export class DrizzleMerchantPatternRepository implements MerchantPatternRepository {
  async findByPattern(familyId: number, rawPattern: string): Promise<MerchantPatternRecord | null> {
    const [row] = await db
      .select()
      .from(merchantPatterns)
      .where(and(eq(merchantPatterns.familyId, familyId), eq(merchantPatterns.rawPattern, rawPattern)))
      .limit(1);
    return row ?? null;
  }

  async create(familyId: number, rawPattern: string, cleanName: string, providerId: number | null): Promise<MerchantPatternRecord> {
    const [row] = await db.insert(merchantPatterns).values({ familyId, rawPattern, cleanName, providerId }).returning();
    return row;
  }
}
