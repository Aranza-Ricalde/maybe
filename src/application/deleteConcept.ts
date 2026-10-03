import type { ConceptsRepository } from "@/domain/concepts/ports";

export class DeleteConceptUseCase {
  constructor(private readonly repo: ConceptsRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
