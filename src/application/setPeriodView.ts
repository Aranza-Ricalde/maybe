import { assertValidPeriodView } from "@/domain/payPeriod/periodView";
import type { PeriodViewRepository } from "@/domain/payPeriod/ports";

export class SetPeriodViewUseCase {
  constructor(private readonly repo: PeriodViewRepository) {}

  async execute(familyId: number, view: string): Promise<void> {
    assertValidPeriodView(view);
    await this.repo.set(familyId, view);
  }
}
