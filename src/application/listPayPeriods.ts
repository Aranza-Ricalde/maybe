import type { PayPeriodRecord, PayPeriodsRepository } from "@/domain/payPeriod/ports";
import { addDays, generateSuggestedPeriods } from "@/domain/payPeriod/rules";

const SEED_PERIOD_COUNT = 26;
const SEED_LOOKBACK_DAYS = 60;

export class ListPayPeriodsUseCase {
  constructor(private readonly repo: PayPeriodsRepository) {}

  async execute(familyId: number, today: string): Promise<PayPeriodRecord[]> {
    const existing = await this.repo.listForFamily(familyId);
    if (existing.length > 0) return existing;

    await this.repo.createMissing(familyId, generateSuggestedPeriods(addDays(today, -SEED_LOOKBACK_DAYS), SEED_PERIOD_COUNT));
    return this.repo.listForFamily(familyId);
  }
}
