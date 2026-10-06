import { assertValidOccurrenceDecision, occurrenceDecisionOutcome, InvalidOccurrenceDecisionError } from "@/domain/recurring/occurrences";
import type { RecurringOccurrencesRepository } from "@/domain/recurring/ports";
import { assertValidOccurrenceMatchSource, assertValidOccurrenceStatus } from "@/domain/recurring/rules";

export class ResolveRecurringOccurrenceUseCase {
  constructor(private readonly repo: RecurringOccurrencesRepository) {}

  async execute(familyId: number, occurrenceId: number, decision: string): Promise<void> {
    assertValidOccurrenceDecision(decision);

    const occurrence = await this.repo.getOccurrence(occurrenceId);
    if (!occurrence || occurrence.familyId !== familyId) {
      throw new InvalidOccurrenceDecisionError("La ocurrencia no existe.");
    }

    const outcome = occurrenceDecisionOutcome(decision);
    assertValidOccurrenceStatus(outcome.status);
    assertValidOccurrenceMatchSource(outcome.matchSource);
    await this.repo.applyDecision(occurrenceId, outcome);
  }
}
