import type { FamilySettingsRepository } from "@/domain/settings/ports";
import { assertValidMinimumBalance } from "@/domain/settings/rules";

export class SetMinimumBalanceUseCase {
  constructor(private readonly repo: FamilySettingsRepository) {}

  async execute(familyId: number, cents: number | null): Promise<void> {
    assertValidMinimumBalance(cents);
    await this.repo.setMinimumBalanceCents(familyId, cents);
  }
}
