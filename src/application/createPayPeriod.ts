import type { PayPeriodRecord, PayPeriodsRepository } from "@/domain/payPeriod/ports";
import { assertValidIsoDate } from "@/domain/ledger/rules";

export class InvalidPayPeriodError extends Error {}

export class CreatePayPeriodUseCase {
  constructor(private readonly repo: PayPeriodsRepository) {}

  async execute(familyId: number, start: string, end: string): Promise<PayPeriodRecord> {
    assertValidIsoDate(start);
    assertValidIsoDate(end);
    if (start > end) {
      throw new InvalidPayPeriodError("la fecha de inicio debe ser anterior o igual a la fecha de fin");
    }
    return this.repo.create(familyId, start, end);
  }
}
