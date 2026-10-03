import type { PayPeriodsRepository } from "@/domain/payPeriod/ports";
import { assertValidIsoDate } from "@/domain/ledger/rules";
import { InvalidPayPeriodError } from "./createPayPeriod";

export class UpdatePayPeriodUseCase {
  constructor(private readonly repo: PayPeriodsRepository) {}

  async execute(id: number, start: string, end: string): Promise<void> {
    assertValidIsoDate(start);
    assertValidIsoDate(end);
    if (start > end) {
      throw new InvalidPayPeriodError("la fecha de inicio debe ser anterior o igual a la fecha de fin");
    }
    await this.repo.update(id, start, end);
  }
}
