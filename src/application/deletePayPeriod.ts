import type { PayPeriodsRepository } from "@/domain/payPeriod/ports";

export class DeletePayPeriodUseCase {
  constructor(private readonly repo: PayPeriodsRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
