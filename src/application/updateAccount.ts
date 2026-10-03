import type { AccountsRepository, UpdateAccountInput } from "@/domain/accounts/ports";
import { assertValidAccountName, assertValidAccountType, InvalidAccountError, mergeAccountDetails } from "@/domain/accounts/rules";

export class UpdateAccountUseCase {
  constructor(private readonly repo: AccountsRepository) {}

  async execute(input: UpdateAccountInput): Promise<void> {
    assertValidAccountName(input.name);
    assertValidAccountType(input.type);

    const existing = await this.repo.getById(input.id);
    if (!existing) {
      throw new InvalidAccountError(`La cuenta ${input.id} no existe.`);
    }

    const details = mergeAccountDetails(existing.details, input.creditLimitCents);
    await this.repo.update(input.id, { name: input.name, type: input.type, details });
  }
}
