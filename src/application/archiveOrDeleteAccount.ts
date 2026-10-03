import type { AccountsRepository } from "@/domain/accounts/ports";
import { decideAccountRemoval } from "@/domain/accounts/rules";

export class ArchiveOrDeleteAccountUseCase {
  constructor(private readonly repo: AccountsRepository) {}

  async execute(accountId: number): Promise<void> {
    const activityCount = await this.repo.getActivityCount(accountId);
    const action = decideAccountRemoval(activityCount);
    if (action === "delete") {
      await this.repo.delete(accountId);
    } else {
      await this.repo.archive(accountId);
    }
  }
}
