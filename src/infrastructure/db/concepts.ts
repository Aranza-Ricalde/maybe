import { and, eq } from "drizzle-orm";
import type { ConceptRecord, ConceptsRepository, NewConceptInput, UpdateConceptInput } from "@/domain/concepts/ports";
import { db } from "./client";
import { concepts } from "./schema/concepts";

export class DrizzleConceptsRepository implements ConceptsRepository {
  async getById(id: number): Promise<ConceptRecord | null> {
    const [row] = await db.select().from(concepts).where(eq(concepts.id, id));
    return row ?? null;
  }

  async findByName(familyId: number, name: string): Promise<ConceptRecord | null> {
    const [row] = await db.select().from(concepts).where(and(eq(concepts.familyId, familyId), eq(concepts.name, name)));
    return row ?? null;
  }

  async listForFamily(familyId: number): Promise<ConceptRecord[]> {
    return db.select().from(concepts).where(eq(concepts.familyId, familyId)).orderBy(concepts.name);
  }

  async create(input: NewConceptInput): Promise<ConceptRecord> {
    const [row] = await db
      .insert(concepts)
      .values({ familyId: input.familyId, name: input.name, categoryId: input.categoryId, providerId: input.providerId, flow: input.flow })
      .returning();
    return row;
  }

  async update(input: UpdateConceptInput): Promise<void> {
    await db
      .update(concepts)
      .set({ name: input.name, categoryId: input.categoryId, providerId: input.providerId, updatedAt: new Date() })
      .where(eq(concepts.id, input.id));
  }

  async delete(id: number): Promise<void> {
    await db.delete(concepts).where(eq(concepts.id, id));
  }
}
