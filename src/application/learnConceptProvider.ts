import type { ConceptsRepository } from "@/domain/concepts/ports";
import type { ConceptMatchingRepository } from "@/domain/matching/ports";
import { isIdentifiableMerchant } from "@/domain/merchants/resolver";

export class LearnConceptProviderUseCase {
  constructor(
    private readonly conceptsRepo: ConceptsRepository,
    private readonly matchingRepo: ConceptMatchingRepository,
  ) {}

  async execute(conceptId: number, transactionId: number): Promise<boolean> {
    const concept = await this.conceptsRepo.getById(conceptId);
    if (!concept || concept.providerId != null) return false;

    const merchant = await this.matchingRepo.getTransactionMerchant(transactionId);
    if (!merchant || merchant.providerId == null || !isIdentifiableMerchant(merchant.merchantName)) return false;

    await this.conceptsRepo.update({ id: concept.id, name: concept.name, categoryId: concept.categoryId, providerId: merchant.providerId });
    return true;
  }
}
