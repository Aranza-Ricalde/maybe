import { and, eq, ilike } from "drizzle-orm";
import type { ProviderRecord, ProvidersRepository } from "@/domain/providers/ports";
import { db } from "./client";
import { providers } from "./schema/providers";

export class DrizzleProvidersRepository implements ProvidersRepository {
  async findByName(familyId: number, name: string): Promise<ProviderRecord | null> {
    const [row] = await db
      .select()
      .from(providers)
      .where(and(eq(providers.familyId, familyId), ilike(providers.name, name)))
      .limit(1);
    return row ?? null;
  }

  async create(familyId: number, name: string): Promise<ProviderRecord> {
    const [row] = await db.insert(providers).values({ familyId, name }).returning();
    return row;
  }

  async listForFamily(familyId: number): Promise<ProviderRecord[]> {
    return db.select().from(providers).where(eq(providers.familyId, familyId)).orderBy(providers.name);
  }

  async update(id: number, name: string): Promise<void> {
    await db.update(providers).set({ name }).where(eq(providers.id, id));
  }

  async delete(id: number): Promise<void> {
    await db.delete(providers).where(eq(providers.id, id));
  }
}
