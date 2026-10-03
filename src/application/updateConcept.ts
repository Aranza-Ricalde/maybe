import type { ConceptsRepository, UpdateConceptInput } from "@/domain/concepts/ports";
import { assertValidConceptName } from "@/domain/concepts/rules";

export class UpdateConceptUseCase {
  constructor(private readonly repo: ConceptsRepository) {}

  async execute(input: UpdateConceptInput): Promise<void> {
    assertValidConceptName(input.name);
    await this.repo.update(input);
  }
}
