import type { AccountsRepository } from "@/domain/accounts/ports";

export class RestoreAccountUseCase {
  constructor(private readonly repo: AccountsRepository) {}

  async execute(accountId: number): Promise<void> {
    await this.repo.restore(accountId);
  }
}
