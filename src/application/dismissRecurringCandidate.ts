import type { RecurringCandidateRepository } from "@/domain/recurring/ports";

export class DismissRecurringCandidateUseCase {
  constructor(private readonly repo: RecurringCandidateRepository) {}

  async execute(candidateId: number): Promise<void> {
    await this.repo.markDismissed(candidateId);
  }
}
