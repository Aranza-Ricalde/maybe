import { classifyFlow } from "@/domain/ledger/rules";
import type { ConceptsRepository } from "@/domain/concepts/ports";
import type { RecurringCandidateRepository, RecurringItemsRepository } from "@/domain/recurring/ports";

export class AcceptRecurringCandidateUseCase {
  constructor(
    private readonly candidatesRepo: RecurringCandidateRepository,
    private readonly recurringItemsRepo: RecurringItemsRepository,
    private readonly conceptsRepo: ConceptsRepository,
  ) {}

  async execute(candidateId: number, todayDayOfMonth: number): Promise<void> {
    const candidate = await this.candidatesRepo.getById(candidateId);
    if (!candidate) return;

    const flow = classifyFlow(candidate.suggestedAmountCents);

    // Solo podemos crear un concepto real si tenemos categoría (concepts.categoryId es obligatorio).
    // Sin ella, el recurrente se crea sin conceptId y sigue cayendo en el match legado por cuenta+categoría.
    let conceptId: number | null = null;
    if (candidate.suggestedCategoryId != null) {
      const existingConcept = await this.conceptsRepo.findByName(candidate.familyId, candidate.suggestedName);
      const concept =
        existingConcept ??
        (await this.conceptsRepo.create({
          familyId: candidate.familyId,
          name: candidate.suggestedName,
          categoryId: candidate.suggestedCategoryId,
          providerId: null,
          flow,
        }));
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
    });

    await this.candidatesRepo.markAccepted(candidateId, item.id);
  }
}
