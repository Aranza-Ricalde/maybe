import type { RecurringItemsRepository, RecurringItemStatus } from "@/domain/recurring/ports";

export class ToggleRecurringItemStatusUseCase {
  constructor(private readonly repo: RecurringItemsRepository) {}

  async execute(id: number, status: RecurringItemStatus): Promise<void> {
    await this.repo.setStatus(id, status);
  }
}
