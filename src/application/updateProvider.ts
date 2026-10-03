import type { ProvidersRepository } from "@/domain/providers/ports";
import { assertValidProviderName, normalizeProviderName } from "@/domain/providers/rules";

export class UpdateProviderUseCase {
  constructor(private readonly repo: ProvidersRepository) {}

  async execute(id: number, name: string): Promise<void> {
    assertValidProviderName(name);
    await this.repo.update(id, normalizeProviderName(name));
  }
}
