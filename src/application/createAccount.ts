import type { AccountsRepository, NewAccountInput } from "@/domain/accounts/ports";
import { assertValidAccountName, assertValidAccountType } from "@/domain/accounts/rules";

export class CreateAccountUseCase {
  constructor(private readonly repo: AccountsRepository) {}

  async execute(input: NewAccountInput): Promise<void> {
    assertValidAccountName(input.name);
    assertValidAccountType(input.type);
    await this.repo.create(input);
  }
}
