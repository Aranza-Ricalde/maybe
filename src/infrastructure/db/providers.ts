import { eq } from "drizzle-orm";
import type { ProviderRecord, ProvidersRepository } from "@/domain/providers/ports";
import { db } from "./client";
import { providers } from "./schema/providers";

export class DrizzleProvidersRepository implements ProvidersRepository {
  async create(familyId: number, name: string): Promise<ProviderRecord> {
    const [row] = await db.insert(providers).values({ familyId, name }).returning();
    return row;
  }

  async listForFamily(familyId: number): Promise<ProviderRecord[]> {
    return db.select().from(providers).where(eq(providers.familyId, familyId)).orderBy(providers.name);
  }
}
