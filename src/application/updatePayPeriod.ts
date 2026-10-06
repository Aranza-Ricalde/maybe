import type { PayPeriodsRepository } from "@/domain/payPeriod/ports";
import { findOverlappingPeriod, periodLabel } from "@/domain/payPeriod/rules";
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
    const current = await this.repo.getById(id);
    if (current) {
      const overlap = findOverlappingPeriod(await this.repo.listForFamily(current.familyId), { start, end }, id);
      if (overlap) {
        throw new InvalidPayPeriodError(`el periodo se traslapa con ${periodLabel(overlap.start, overlap.end)}: un mismo día no puede pertenecer a dos periodos`);
      }
    }
    await this.repo.update(id, start, end);
  }
}
