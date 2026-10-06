import { and, eq } from "drizzle-orm";
import type { MerchantPatternRecord, MerchantPatternRepository } from "@/domain/merchants/ports";
import type { MerchantHistoryEntry } from "@/domain/merchants/resolver";
import { db } from "./client";
import { merchantPatterns } from "./schema/classification";

export class DrizzleMerchantPatternRepository implements MerchantPatternRepository {
  async findById(id: number): Promise<MerchantPatternRecord | null> {
    const [row] = await db.select().from(merchantPatterns).where(eq(merchantPatterns.id, id)).limit(1);
    return row ?? null;
  }

  async findByPattern(familyId: number, rawPattern: string): Promise<MerchantPatternRecord | null> {
    const [row] = await db
      .select()
      .from(merchantPatterns)
      .where(and(eq(merchantPatterns.familyId, familyId), eq(merchantPatterns.rawPattern, rawPattern)))
      .limit(1);
    return row ?? null;
  }

  async listHistory(familyId: number): Promise<MerchantHistoryEntry[]> {
    const rows = await db
      .select({ rawPattern: merchantPatterns.rawPattern, cleanName: merchantPatterns.cleanName })
      .from(merchantPatterns)
      .where(eq(merchantPatterns.familyId, familyId));
    return rows.map((r) => ({ description: r.rawPattern, merchantName: r.cleanName }));
  }

  async create(familyId: number, rawPattern: string, cleanName: string, providerId: number | null): Promise<MerchantPatternRecord> {
    const [row] = await db.insert(merchantPatterns).values({ familyId, rawPattern, cleanName, providerId }).returning();
    return row;
  }
}
