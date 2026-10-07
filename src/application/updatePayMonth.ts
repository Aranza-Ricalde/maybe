import { assertValidIsoDate } from "@/domain/ledger/rules";
import { planMonthResize } from "@/domain/payPeriod/periodView";
import type { PayPeriodsRepository } from "@/domain/payPeriod/ports";
import { InvalidPayPeriodError } from "./createPayPeriod";

export class UpdatePayMonthUseCase {
  constructor(private readonly repo: PayPeriodsRepository) {}

  async execute(familyId: number, memberPeriodId: number, start: string, end: string): Promise<void> {
    assertValidIsoDate(start);
    assertValidIsoDate(end);
    const plan = planMonthResize(await this.repo.listForFamily(familyId), memberPeriodId, start, end);
    if ("error" in plan) throw new InvalidPayPeriodError(plan.error);
    for (const update of plan.updates) await this.repo.update(update.id, update.start, update.end);
  }
}
