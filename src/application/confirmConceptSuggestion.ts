import type { ConceptsRepository } from "@/domain/concepts/ports";
import type { ConceptMatchingRepository } from "@/domain/matching/ports";
import type { UpdateTransactionUseCase } from "./updateTransaction";

export class ConfirmConceptSuggestionUseCase {
  constructor(
    private readonly matchingRepo: ConceptMatchingRepository,
    private readonly conceptsRepo: ConceptsRepository,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
  ) {}

  async execute(suggestionId: number): Promise<void> {
    const suggestion = await this.matchingRepo.getSuggestionById(suggestionId);
    if (!suggestion) return;

    const concept = await this.conceptsRepo.getById(suggestion.suggestedConceptId);
    if (!concept) return;

    const tx = await this.matchingRepo.getTransactionForMatching(suggestion.transactionId);
    if (!tx) return;

    await this.updateTransactionUseCase.execute({
      id: suggestion.transactionId,
      accountId: tx.accountId,
      date: tx.date,
      amountCents: tx.amountCents,
      name: tx.name,
      categoryId: concept.categoryId,
      conceptId: concept.id,
    });

    await this.matchingRepo.deleteSuggestion(suggestionId);
  }
}
