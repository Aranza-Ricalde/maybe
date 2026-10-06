import type { RecurringItemsRepository, RecurringItemStatus } from "@/domain/recurring/ports";
import { assertValidRecurringStatus } from "@/domain/recurring/rules";

export class ToggleRecurringItemStatusUseCase {
  constructor(private readonly repo: RecurringItemsRepository) {}

  async execute(id: number, status: RecurringItemStatus): Promise<void> {
    assertValidRecurringStatus(status);
    await this.repo.setStatus(id, status);
  }
}
