import type { ProviderRecord, ProvidersRepository } from "@/domain/providers/ports";
import { assertValidProviderName, normalizeProviderName } from "@/domain/providers/rules";

export class CreateProviderUseCase {
  constructor(private readonly repo: ProvidersRepository) {}

  async execute(familyId: number, name: string): Promise<ProviderRecord> {
    assertValidProviderName(name);
    const normalized = normalizeProviderName(name);
    const existing = await this.repo.findByName(familyId, normalized);
    if (existing) return existing;
    return this.repo.create(familyId, normalized);
  }
}
