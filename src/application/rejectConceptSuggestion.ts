import type { ConceptMatchingRepository } from "@/domain/matching/ports";

export class RejectConceptSuggestionUseCase {
  constructor(private readonly matchingRepo: ConceptMatchingRepository) {}

  async execute(suggestionId: number): Promise<void> {
    await this.matchingRepo.markSuggestionRejected(suggestionId);
  }
}
