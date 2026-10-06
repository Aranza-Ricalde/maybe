import { classifyFlow } from "@/domain/ledger/rules";
import type { ConceptsRepository } from "@/domain/concepts/ports";
import type { MerchantPatternRepository } from "@/domain/merchants/ports";
import { isIdentifiableMerchant } from "@/domain/merchants/resolver";
import { inclusionForNewItem } from "@/domain/recurring/budgetInclusion";
import type { RecurringBudgetRepository, RecurringCandidateRepository, RecurringItemsRepository } from "@/domain/recurring/ports";
import { merchantIdFromPatternSignature } from "@/domain/recurring/rules";
import { ensureConcept } from "./ensureConcept";

export class AcceptRecurringCandidateUseCase {
  constructor(
    private readonly candidatesRepo: RecurringCandidateRepository,
    private readonly recurringItemsRepo: RecurringItemsRepository,
    private readonly conceptsRepo: ConceptsRepository,
    private readonly merchantsRepo: MerchantPatternRepository,
    private readonly budgetRepo?: RecurringBudgetRepository,
  ) {}

  async execute(candidateId: number, todayDayOfMonth: number): Promise<void> {
    const candidate = await this.candidatesRepo.getById(candidateId);
    if (!candidate) return;

    const flow = classifyFlow(candidate.suggestedAmountCents);

    let conceptId: number | null = null;
    if (candidate.suggestedCategoryId != null) {
      const concept = await ensureConcept(this.conceptsRepo, {
        familyId: candidate.familyId,
        name: candidate.suggestedName,
        categoryId: candidate.suggestedCategoryId,
        flow,
        providerId: await this.detectedProviderId(candidate.patternSignature),
      });
      conceptId = concept.id;
    }

    const item = await this.recurringItemsRepo.create({
      familyId: candidate.familyId,
      name: candidate.suggestedName,
      flow,
      estimatedAmountCents: candidate.suggestedAmountCents,
      categoryId: candidate.suggestedCategoryId,
      conceptId,
      dayOfMonth: todayDayOfMonth,
      accountId: candidate.accountId,
      autoDetected: true,
      budgetInclusion: this.budgetRepo ? inclusionForNewItem(await this.budgetRepo.getPolicy(candidate.familyId)) : null,
    });

    await this.candidatesRepo.markAccepted(candidateId, item.id);
  }

  private async detectedProviderId(patternSignature: string): Promise<number | null> {
    const merchantId = merchantIdFromPatternSignature(patternSignature);
    if (merchantId == null) return null;
    const merchant = await this.merchantsRepo.findById(merchantId);
    return merchant && isIdentifiableMerchant(merchant.cleanName) ? merchant.providerId : null;
  }
}
