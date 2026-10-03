import type { RecurringCandidateRepository, RecurringItemsRepository } from "@/domain/recurring/ports";

export class DeleteRecurringItemUseCase {
  constructor(
    private readonly recurringItemsRepo: RecurringItemsRepository,
    private readonly candidatesRepo: RecurringCandidateRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.candidatesRepo.clearAcceptedRecurringItemId(id);
    await this.recurringItemsRepo.delete(id);
  }
}
