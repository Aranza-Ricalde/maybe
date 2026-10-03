import type { ProvidersRepository } from "@/domain/providers/ports";

export class DeleteProviderUseCase {
  constructor(private readonly repo: ProvidersRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
