import type { BudgetsRepository } from "@/domain/budget/ports";

export class DeleteBudgetLineUseCase {
  constructor(private readonly repo: BudgetsRepository) {}

  async execute(familyId: number, categoryId: number): Promise<void> {
    await this.repo.deleteLine(familyId, categoryId);
  }
}
