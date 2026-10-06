import type { ConceptRecord, ConceptsRepository } from "@/domain/concepts/ports";
import type { Flow } from "@/domain/ledger/rules";

export interface EnsureConceptInput {
  familyId: number;
  name: string;
  categoryId: number;
  flow: Flow;
  providerId?: number | null;
}

export async function ensureConcept(repo: ConceptsRepository, input: EnsureConceptInput): Promise<ConceptRecord> {
  const existing = await repo.findByName(input.familyId, input.name);
  if (existing) {
    if (existing.providerId == null && input.providerId != null) {
      await repo.update({ id: existing.id, name: existing.name, categoryId: existing.categoryId, providerId: input.providerId });
      return { ...existing, providerId: input.providerId };
    }
    return existing;
  }
  return repo.create({
    familyId: input.familyId,
    name: input.name,
    categoryId: input.categoryId,
    providerId: input.providerId ?? null,
    flow: input.flow,
  });
}
