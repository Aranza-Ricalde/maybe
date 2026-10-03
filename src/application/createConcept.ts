import type { ConceptRecord, ConceptsRepository, NewConceptInput } from "@/domain/concepts/ports";
import { assertValidConceptName } from "@/domain/concepts/rules";

export class CreateConceptUseCase {
  constructor(private readonly repo: ConceptsRepository) {}

  async execute(input: NewConceptInput): Promise<ConceptRecord> {
    assertValidConceptName(input.name);
    return this.repo.create(input);
  }
}
